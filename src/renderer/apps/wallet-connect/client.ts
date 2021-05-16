import * as log from 'electron-log'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { ERROR, getError } from '@walletconnect/utils'
import { SessionTypes } from '@walletconnect/types'
import { Lock } from '@celo/base/lib/lock'

import SessionStorage from './storage'
import { CFG } from '../../../lib/cfg'
import { Account } from '../../../lib/accounts/accounts'

if (module.hot) {
	module.hot.decline()
}

export interface ErrorResponse {
    code: number;
    message: string;
    data?: string;
}

const pairingBySessionKey = "xxx:session-pairings"

export class WalletConnectGlobal {
	public requests: SessionTypes.RequestParams[] = []

	private _wc: WalletConnectClient | undefined
	private wcMX = new Lock()

	// Manually maintain a mapping from Session Topic -> Pairing Topic. This is helpful
	// to clean up pairings after sessions have been disconnected. Otherwise pairings will
	// stay around until their expiry period which can be quite long. Also defunct pairings
	// can generate additional random error messages at the startup.
	private pairingBySession = new Map<string, string>()

	public init = async (): Promise<WalletConnectClient> => {
		await this.wcMX.acquire()
		try {
			const wc = await this._init()
			return wc
		} finally {
			this.wcMX.release()
		}
	}

	private _init = async (): Promise<WalletConnectClient> => {
		if (this._wc) {
			return this._wc
		}
		const storage = new SessionStorage()
		log.info(`wallet-connect: initialized with Storage`, await storage.getKeys())
		const pairingData = await storage.getItem<[string, string][]>(pairingBySessionKey)
		this.pairingBySession = new Map<string, string>(pairingData || [])
		this._wc = await WalletConnectClient.init({
			relayProvider: "wss://walletconnect.celo.org",
			// relayProvider: "wss://walletconnect.celo-networks-dev.org",
			controller: true,
			storage: storage,
		})
		this.cleanupPairings()
		this._wc.on(CLIENT_EVENTS.session.deleted, this.cleanupPairings)
		this._wc.on(CLIENT_EVENTS.session.request, this.onRequest)
		return this._wc
	}

	public resetStorage = async (afterMX?: () => void): Promise<void> => {
		await this.wcMX.acquire()
		try {
			if (afterMX) { afterMX() }
			if (this._wc) {
				this._wc.off(CLIENT_EVENTS.session.deleted, this.cleanupPairings)
				this._wc.off(CLIENT_EVENTS.session.request, this.onRequest)
				for (const session of this._wc.session.values) {
					await this._wc.disconnect({topic: session.topic, reason: getError(ERROR.USER_DISCONNECTED)})
				}
				for (const pairing of this._wc.pairing.values) {
					await this._wc.pairing.delete({topic: pairing.topic, reason: getError(ERROR.USER_DISCONNECTED)})
				}
				this._wc.relayer.provider.events.removeAllListeners()
				await this._wc.relayer.provider.disconnect()
				this._wc.session.events.removeAllListeners()
				this._wc = undefined
				this.requests = []
			}
			const storage = new SessionStorage()
			const storageKeys = await storage.getKeys()
			log.info(`wallet-connect: clearing storage`, storageKeys)
			for (const key of storageKeys) {
				await storage.removeItem(key)
			}
			return
		} finally {
			this.wcMX.release()
		}
	}

	public wc = (): WalletConnectClient => {
		if (!this._wc) {
			throw new Error("WalletConnectGlobal not initialized!")
		}
		return this._wc
	}

	public wcMaybe = (): WalletConnectClient | undefined => {
		return this._wc
	}

	public cleanupPairings = (): void => {
		if (!this._wc) {
			return
		}
		log.info(
			`wallet-connect: sessions: ` +
			`settled: ${this._wc.session.length}, ` +
			`pending: ${this._wc.session.pending.length}, ` +
			`history: ${this._wc.session.history.size}`)
		log.info(
			`wallet-connect: pairings: ` +
			`settled: ${this._wc.pairing.length}, ` +
			`pending: ${this._wc.pairing.pending.length}, ` +
			`history: ${this._wc.session.history.size}`)
		for (const pending of this._wc.session.pending.values) {
			log.info(`wallet-connect: deleting pending sessions`, pending.topic)
			this._wc.session.pending.delete(pending.topic, getError(ERROR.USER_DISCONNECTED))
		}
		const sessionTopics = new Set(this._wc.session.values.map((v) => v.topic))
		this.pairingBySession.forEach((v, k) => {
			if (!sessionTopics.has(k)) {
				this.pairingBySession.delete(k)
			}
		})
		this.persistPairingBySession()

		const pairingsToKeep = new Set(this.pairingBySession.values())
		log.info(`wallet-connect: connected pairings`, Array.from(pairingsToKeep.values()))
		const pairingsToDelete = this._wc.pairing.values.filter((p) => !pairingsToKeep.has(p.topic))
		for (const pairing of pairingsToDelete) {
			log.info(`wallet-connect: deleting disconnected settled pairing`, pairing.topic)
			this._wc.pairing.delete({
				topic: pairing.topic,
				reason: getError(ERROR.USER_DISCONNECTED),
			})
		}
		const pendingsToDelete = this._wc.pairing.pending.values.filter((p) => !pairingsToKeep.has(p.topic))
		for (const pairing of pendingsToDelete) {
			log.info(`wallet-connect: deleting disconnected pending pairing`, pairing.topic)
			this._wc.pairing.pending.delete(pairing.topic, getError(ERROR.USER_DISCONNECTED))
		}
	}

	public approve = async (
		proposal: SessionTypes.Proposal,
		accounts: Account[]): Promise<SessionTypes.Settled> => {
		const chainId = `celo:${CFG().chainId}`
		const response: SessionTypes.Response = {
      metadata: {
        name: "Celo Terminal",
        description: "Celo Terminal",
        url: "https://celoterminal.com",
        icons: ["https://celoterminal.com/static/favicon.ico"],
      },
      state: {
        accounts: accounts.map((a) => `${a.address}@${chainId}`),
      },
    }
		const settled = await this.wc().approve({proposal, response})
		this.pairingBySession.set(
			settled.topic,
			proposal.signal.params.topic)
		await this.persistPairingBySession()
		return settled
	}

	private persistPairingBySession = async () => {
		return this.wc().storage.setItem(pairingBySessionKey, Array.from(this.pairingBySession.entries()))
	}

	private onRequest = (event: SessionTypes.RequestParams) => {
		const chainId = `celo:${CFG().chainId}`
		if (event.chainId !== chainId) {
			this.reject(event, {
				code: -32000,
				message: `Expected ChainId: ${chainId}, received: ${event.chainId}`,
			})
			return
		}

		switch (event.request.method) {
		case "eth_signTransaction":
			this.requests.push(event)
			break
		default:
			log.info(`wallet-connect: rejected not supported request`, event)
			this.reject(event, {
				code: -32000,
				message: `Celo Terminal does not support: ${event.request.method}`
			})
		}
	}

	public respond = <T>(
		r: SessionTypes.RequestParams,
		result: T): void => {
		this.requestRM(r)
		this.wc().respond({
			topic: r.topic,
			response: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				id: (r.request as any).id,
				jsonrpc: '2.0',
				result: result,
			}
		})
	}

	public reject = (
		r: SessionTypes.RequestParams,
		error: ErrorResponse): void => {
		this.requestRM(r)
		this.wc().respond({
			topic: r.topic,
			response: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				id: (r.request as any).id,
				jsonrpc: '2.0',
				error: error,
			}
		})
	}

	private requestRM(r: SessionTypes.RequestParams) {
		const idx = this.requests.indexOf(r)
		if (idx >= 0) {
			this.requests.splice(idx, 1)
		}
	}

	public notifyCount = (): number => {
		if (!this._wc) { this.init() }
		return this.requests.length
	}

}

export const wcGlobal = new WalletConnectGlobal()
