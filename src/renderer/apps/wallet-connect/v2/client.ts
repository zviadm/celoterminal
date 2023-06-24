import * as log from 'electron-log'
import { Web3Wallet, IWeb3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'
import { Core } from "@walletconnect/core";
import { Lock } from '@celo/base/lib/lock'

import { CFG } from '../../../../lib/cfg'
import { showWindowAndFocus } from '../../../electron-utils'
import { SessionTypes } from '@walletconnect/types';
import { ISession, SessionMetadata } from '../session';
import { getSdkError } from '@walletconnect/utils';

if (module.hot) {
	module.hot.decline()
}

const core = new Core({
  projectId: "9e9a1a2420615978dc2409e90543aef9",
});

export interface ErrorResponse {
    code: number;
    message: string;
    data?: string;
}

export class WalletConnectGlobal {
	public requests: Web3WalletTypes.SessionRequest[] = []

	private _wc: IWeb3Wallet | undefined
	private wcMX = new Lock()

	public init = async (): Promise<IWeb3Wallet> => {
		await this.wcMX.acquire()
		try {
			const wc = await this._init()
			return wc
		} finally {
			this.wcMX.release()
		}
	}

	private _init = async (): Promise<IWeb3Wallet> => {
		if (this._wc) {
			return this._wc
		}
		// const storage = new PrefixedStorage()
		// log.info(`wallet-connect: initialized with Storage`, await storage.getKeys())
		this._wc = await Web3Wallet.init({
			core,
			metadata: {
				name: "Celo Terminal",
				description: "The one-stop shop for everything Celo",
				url: "https://celoterminal.com",
				icons: ["https://celoterminal.com/static/favicon.ico"],
			},
		})
		this._wc.on("session_request", this.onRequest)
		return this._wc
	}

	public wc = (): IWeb3Wallet => {
		if (!this._wc) {
			throw new Error("WalletConnectGlobal not initialized!")
		}
		return this._wc
	}

	public wcMaybe = (): IWeb3Wallet | undefined => {
		return this._wc
	}

	private onRequest = (event: Web3WalletTypes.SessionRequest) => {
		log.info(`wallet-connect: received request`, event)
		const chainId = `eip155:${CFG().chainId}`
		if (event.params.chainId !== chainId) {
			log.info(`wallet-connect: rejected request with invalid chainId`)
			this.reject(event, {
				code: -32000,
				message: `Expected ChainId: ${chainId}, received: ${event.params.chainId}`,
			})
			return
		}

		switch (event.params.request.method) {
		case "eth_signTransaction":
			this.requests.push(event)
			showWindowAndFocus()
			break
		default:
			log.info(`wallet-connect: rejected not supported request`)
			this.reject(event, {
				code: -32000,
				message: `Celo Terminal does not support: ${event.params.request.method}`
			})
		}
	}

	public respond = <T>(
		r: Web3WalletTypes.SessionRequest,
		result: T): void => {
		this.requestRM(r)
		this.wc().respondSessionRequest({
			topic: r.topic,
			response: {
				id: r.id,
				jsonrpc: '2.0',
				result: result,
			}
		})
	}

	public reject = (
		r: Web3WalletTypes.SessionRequest,
		error: ErrorResponse): void => {
		this.requestRM(r)
		this.wc().respondSessionRequest({
			topic: r.topic,
			response: {
				id: r.id,
				jsonrpc: '2.0',
				error: error,
			}
		})
	}

	private requestRM(r: Web3WalletTypes.SessionRequest) {
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

export class SessionWrapper implements ISession {
	constructor(private session: SessionTypes.Struct) {}

	isConnected = (): boolean => {
		return true
	}

	disconnect = (): void => {
		wcGlobal.wc().disconnectSession({topic: this.session.topic, reason: getSdkError("USER_DISCONNECTED")})
	}

	metadata = (): SessionMetadata => {
		const accounts = this.session.namespaces[this.session.topic].accounts
		return {
			...this.session.self.metadata,
			accounts,
		}
	}
}

export const wcGlobal = new WalletConnectGlobal()
wcGlobal.init()
