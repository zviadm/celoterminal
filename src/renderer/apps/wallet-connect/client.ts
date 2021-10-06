import { remote } from 'electron'
import * as log from 'electron-log'
import * as pino from 'pino'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { ERROR } from '@walletconnect/utils'
import { SessionTypes } from '@walletconnect/types'
import { Lock } from '@celo/base/lib/lock'

import PrefixedStorage from './storage'
import { CFG } from '../../../lib/cfg'
import { Account } from '../../../lib/accounts/accounts'
import { showWindowAndFocus } from './electron-utils'
import { sleep } from '../../../lib/utils'

if (module.hot) {
	module.hot.decline()
}

export interface ErrorResponse {
    code: number;
    message: string;
    data?: string;
}

export class WalletConnectGlobal {
	public requests: SessionTypes.RequestEvent[] = []

	private _wc: WalletConnectClient | undefined
	private wcMX = new Lock()

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
		const storage = new PrefixedStorage()
		log.info(`wallet-connect: initialized with Storage`, await storage.getKeys())
		this._wc = await WalletConnectClient.init({
			relayProvider: "wss://relay.walletconnect.org",
			// relayProvider: "wss://walletconnect.celo.org",
			// relayProvider: "wss://walletconnect.celo-networks-dev.org",
			controller: true,
			storage: storage,
			logger: remote.app.isPackaged ?
				pino(
					{
						level: "warn",
						prettyPrint: {
							colorize: false,
							translateTime: 'SYS:standard',
							ignore: 'pid,hostname',
						},
					},
					pino.destination(log.transports.file.getFile().path),
				) :
				"debug",
		})
		this._wc.on(CLIENT_EVENTS.session.request, this.onRequest)
		return this._wc
	}

	public resetStorage = async (afterMX?: () => void): Promise<void> => {
		await this.wcMX.acquire()
		try {
			if (afterMX) { afterMX() }
			if (this._wc) {
				this._wc.off(CLIENT_EVENTS.session.request, this.onRequest)
				const _wc = this._wc
				const disconnectSessions = this._wc.session.values.map(
					(session) => _wc.disconnect({topic: session.topic, reason: ERROR.USER_DISCONNECTED.format()}))
				const deletePairings = this._wc.pairing.values.map(
					(pairing) => _wc.pairing.delete({topic: pairing.topic, reason: ERROR.USER_DISCONNECTED.format()}))
				await Promise.race([Promise.all([...disconnectSessions, ...deletePairings]), sleep(1000)])
				this._wc.relayer.provider.events.removeAllListeners()
				await Promise.race([this._wc.relayer.provider.disconnect(), sleep(5000)])
				this._wc.session.events.removeAllListeners()
				this._wc = undefined
				this.requests = []
			}
			const storage = new PrefixedStorage()
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

	public approve = async (
		proposal: SessionTypes.Proposal,
		accounts: Account[]): Promise<SessionTypes.Settled> => {
		const chainId = `eip155:${CFG().chainId}`
		const response: SessionTypes.ResponseInput = {
			metadata: {
				name: "Celo Terminal",
				description: "The one-stop shop for everything Celo",
				url: "https://celoterminal.com",
				icons: ["https://celoterminal.com/static/favicon.ico"],
			},
      state: {
        accounts: accounts.map((a) => `${chainId}:${a.address}`),
      },
    }
		const settled = await this.wc().approve({proposal, response})
		return settled
	}

	private onRequest = (event: SessionTypes.RequestEvent) => {
		log.info(`wallet-connect: received request`, event)
		const chainId = `eip155:${CFG().chainId}`
		if (event.chainId !== chainId) {
			log.info(`wallet-connect: rejected request with invalid chainId`)
			this.reject(event, {
				code: -32000,
				message: `Expected ChainId: ${chainId}, received: ${event.chainId}`,
			})
			return
		}

		switch (event.request.method) {
		case "eth_signTransaction":
			this.requests.push(event)
			showWindowAndFocus()
			break
		default:
			log.info(`wallet-connect: rejected not supported request`)
			this.reject(event, {
				code: -32000,
				message: `Celo Terminal does not support: ${event.request.method}`
			})
		}
	}

	public respond = <T>(
		r: SessionTypes.RequestEvent,
		result: T): void => {
		this.requestRM(r)
		this.wc().respond({
			topic: r.topic,
			response: {
				id: r.request.id,
				jsonrpc: '2.0',
				result: result,
			}
		})
	}

	public reject = (
		r: SessionTypes.RequestEvent,
		error: ErrorResponse): void => {
		this.requestRM(r)
		this.wc().respond({
			topic: r.topic,
			response: {
				id: r.request.id,
				jsonrpc: '2.0',
				error: error,
			}
		})
	}

	private requestRM(r: SessionTypes.RequestEvent) {
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
