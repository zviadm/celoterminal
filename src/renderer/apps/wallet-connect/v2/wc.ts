import * as log from 'electron-log'
import { IWeb3Wallet, Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'
import { Core } from "@walletconnect/core";
import { Lock } from '@celo/base/lib/lock'

import { CFG } from '../../../../lib/cfg'
import { showWindowAndFocus } from '../../../electron-utils'
import { SessionTypes } from '@walletconnect/types';
import { ISession, SessionMetadata } from '../session';
import { getSdkError } from '@walletconnect/utils';
import { IJsonRpcErrorMessage, RequestPayload, WCRequest, requestQueueGlobal } from '../request-queue';

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
			this.wc().respondSessionRequest({
				topic: event.topic,
				response: {
					id: event.id,
					jsonrpc: "2.0",
					error: {
						code: -32000,
						message: `Expected ChainId: ${chainId}, received: ${event.params.chainId}`,
					}
				}
			})
			return
		}

		switch (event.params.request.method) {
		case "eth_sendTransaction":
		case "eth_signTransaction":
			requestQueueGlobal().pushRequest(
				new WCV2Request(this.wc(), event.topic, {
					id: event.id,
					method: event.params.request.method,
					params: event.params.request.params[0],
				})
			)
			showWindowAndFocus()
			break
		case "personal_sign":
			requestQueueGlobal().pushRequest(
				new WCV2Request(this.wc(), event.topic, {
					id: event.id,
					method: "eth_signPersonal",
					params: {
						data: event.params.request.params[0] as string,
						from: event.params.request.params[1] as string,
					}
				})
			)
			break
		default:
			log.info(`wallet-connect: rejected not supported request`)
			this.wc().respondSessionRequest({
				topic: event.topic,
				response: {
					id: event.id,
					jsonrpc: "2.0",
					error: {
						code: -32000,
						message: `Method: ${event.params.request.method} not supported!`,
					}
				}
			})
		}
	}
}

export class SessionWrapper implements ISession {
	constructor(private session: SessionTypes.Struct) {}

	isConnected = (): boolean => {
		return !!wcGlobal.wc().getActiveSessions()[this.session.topic]
	}

	disconnect = (): void => {
		if (!this.isConnected()) {
			return
		}
		try {
			wcGlobal.wc().disconnectSession({topic: this.session.topic, reason: getSdkError("USER_DISCONNECTED")})
		} catch (e) {
			console.warn(e)
		}
	}

	metadata = (): SessionMetadata => {
		const accounts = this.session.namespaces.eip155.accounts.map((a) => a.split(":").pop() || a)
		return {
			...this.session.self.metadata,
			accounts,
		}
	}
}

class WCV2Request implements WCRequest {
	constructor(
		private wc: IWeb3Wallet,
		private topic: string,
		public readonly request: RequestPayload) {
	}

	reject = (error?: IJsonRpcErrorMessage): void => {
		this.wc.respondSessionRequest({
			topic: this.topic,
			response: {
				id: this.request.id,
				jsonrpc: '2.0',
				error: error || getSdkError("USER_REJECTED"),
			}
		})
	}

	approve = (result: unknown): void => {
		this.wc.respondSessionRequest({
			topic: this.topic,
			response: {
				id: this.request.id,
				jsonrpc: '2.0',
				result: result,
			}
		})
	}
}

export const wcGlobal = new WalletConnectGlobal()
wcGlobal.init()

export const initializeStoredSessions = (): SessionWrapper[] => {
	const sessions = Object.values(wcGlobal.wc().getActiveSessions())
	return sessions.map((s) => new SessionWrapper(s))
}
