import * as log from 'electron-log'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { ERROR, getError } from '@walletconnect/utils'
import { SessionTypes } from '@walletconnect/types'
import { Lock } from '@celo/base/lib/lock'
import { SupportedMethods } from '@celo/wallet-walletconnect'

import SessionStorage from './storage'
import { CFG } from '../../../lib/cfg'
import { Account } from '../../../lib/accounts/accounts'

export interface ErrorResponse {
    code: number;
    message: string;
    data?: string;
}

export class WalletConnectGlobal {
	public requests: SessionTypes.RequestParams[] = []

	private _wc: WalletConnectClient | undefined
	private wcMX = new Lock()

	public init = async (): Promise<WalletConnectClient> => {
		await this.wcMX.acquire()
		try {
			if (this._wc) {
				return this._wc
			}
			const storage = new SessionStorage()
			this._wc = await WalletConnectClient.init({
				relayProvider: "wss://walletconnect.celo.org",
				// relayProvider: "wss://walletconnect.celo-networks-dev.org",
				controller: true,
				storage: storage,
			})
			this.cleanupPairings()
			this._wc.on(CLIENT_EVENTS.session.request, this.onRequest)
			return this._wc
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
		const peers = new Set(this._wc.session.values.map((v) => v.peer.publicKey))
		const pairingsToDelete = this._wc.pairing.values.filter((p) => !peers.has(p.peer.publicKey))
		for (const pairing of pairingsToDelete) {
			log.info(`wallet-connect: deleting disconnected pairing`, pairing.topic)
			this._wc.pairing.delete({
				topic: pairing.topic,
				reason: getError(ERROR.USER_DISCONNECTED),
			})
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
		return wcGlobal.wc().approve({proposal, response})
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
		case SupportedMethods.signTransaction:
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
