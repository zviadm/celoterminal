import * as log from 'electron-log'
import { Lock } from '@celo/base/lib/lock'
import { IWeb3Wallet, Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'
import { Core } from "@walletconnect/core";
import { SessionTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';

import { CFG } from '../../../../lib/cfg'
import { showWindowAndFocus } from '../../../electron-utils'
import { ISession, SessionMetadata } from '../session';
import { IJsonRpcErrorMessage, RequestPayload, WCRequest, requestQueueGlobal } from '../request-queue';
import { IS_E2E_TEST } from '../../../../lib/e2e-constants';

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

	private onRequest = async (event: Web3WalletTypes.SessionRequest) => {
		log.info(`wallet-connect: received request`, event)
		const chainId = `eip155:${CFG().chainId}`
		if (event.params.chainId !== chainId &&
			// Allow personal and signedTypedData signing for ETHEREUM network requests too.
			// Many dApps just specify eip155:1 when trying to get a signed message and ignore
			// actual network that it is for.
			(event.params.chainId !== "eip155:1" ||
				event.params.request.method === "eth_sendTransaction" ||
				event.params.request.method === "eth_signTransaction")) {
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

		const rq = await requestQueueGlobal()
		switch (event.params.request.method) {
			case "eth_sendTransaction":
			case "eth_signTransaction":
				rq.pushRequest(
					new WCV2Request(this.wc(), event.topic, {
						id: event.id,
						method: event.params.request.method,
						params: {
							...event.params.request.params[0],
							chainId: CFG().chainId,
						},
					})
				)
				showWindowAndFocus()
				break
			case "personal_sign":
				rq.pushRequest(
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
			case "eth_signTypedData_v4":
				rq.pushRequest(
					new WCV2Request(this.wc(), event.topic, {
						id: event.id,
						method: "eth_signTypedData_v4",
						params: {
							from: event.params.request.params[0] as string,
							data: event.params.request.params[1] as string,
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
	constructor(private session: SessionTypes.Struct) { }

	isConnected = (): boolean => {
		return !!wcGlobal.wc().getActiveSessions()[this.session.topic]
	}

	disconnect = (): void => {
		if (!this.isConnected()) {
			return
		}
		wcGlobal.wc().disconnectSession(
			{ topic: this.session.topic, reason: getSdkError("USER_DISCONNECTED") })
	}

	metadata = (): SessionMetadata => {
		const accounts = this.session.namespaces.eip155.accounts.map((a) => a.split(":").pop() || a)
		return {
			...this.session.peer.metadata,
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
if (!IS_E2E_TEST) {
	// Don't initialize WalletConnect in E2E Tests to avoid random error snacks.
	wcGlobal.init()
}

export const initializeStoredSessions = async (): Promise<SessionWrapper[]> => {
	const wc = await wcGlobal.init()
	const sessions = Object.values(wc.getActiveSessions())
	return sessions.map((s) => new SessionWrapper(s))
}
