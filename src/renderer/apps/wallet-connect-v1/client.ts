import log from 'electron-log'
import { CeloTx } from '@celo/connect'
import WalletConnect from 'wcv1/client'
import { CFG } from '../../../lib/cfg'
import { showWindowAndFocus } from '../../electron-utils'

if (module.hot) {
	module.hot.decline()
}

export const celoTerminalMetadata = {
	name: "Celo Terminal",
	description: "The one-stop shop for everything Celo",
	url: "https://celoterminal.com",
	icons: ["https://celoterminal.com/static/favicon.ico"],
}

export interface IJsonRpcErrorMessage {
	code?: number;
	message: string;
}

export interface BaseRequest {
	id: number
	method: string
}
export interface EthSendTransaction extends BaseRequest {
	method: "eth_sendTransaction"
	params?: CeloTx,
}
export interface EthSignTransaction extends BaseRequest {
	method: "eth_signTransaction"
	params?: CeloTx,
}
export type RequestPayload = EthSendTransaction | EthSignTransaction

export const requestQueueGlobal: WCRequest[] = []

export class WCRequest {
	constructor(
		private wc: WalletConnect,
		public readonly request: RequestPayload) {
	}

	private removeFromGlobal = () => {
		const idx = requestQueueGlobal.indexOf(this)
		if (idx >= 0) {
			requestQueueGlobal.splice(idx, 1)
		}
	}

	reject = (error?: IJsonRpcErrorMessage): void => {
		this.removeFromGlobal()
		return this.wc.rejectRequest({
			id: this.request.id,
			error: error,
		})
	}

	approve = (result: unknown): void => {
		this.removeFromGlobal()
		return this.wc.approveRequest({
			id: this.request.id,
			result: result,
		})
	}
}

export const setupWCHandlers = (wc: WalletConnect): void => {
	wc.on("disconnect", (error) => {
		log.info(`wallet-connect: disconnected ${wc.session.peerMeta?.name}`, error)
	})
	wc.on("call_request", (error, payload: {id: number, method: string, params: unknown[]}) => {
		if (error) {
			log.error(`wallet-connect: call_request error`, error)
			return
		}
		log.info(`wallet-connect: call_request`, payload)
		switch (payload.method) {
		case "eth_sendTransaction":
		case "eth_signTransaction": {
			const params = payload.params[0] as CeloTx
			if (!params.chainId) {
				params.chainId = Number.parseInt(CFG().chainId)
			}
			requestQueueGlobal.push(
				new WCRequest(wc, {
					id: payload.id,
					method: payload.method,
					params: params,
				})
			)
			log.info(`wallet-connect: received transaction`, requestQueueGlobal)
			showWindowAndFocus()
			break
		}
		default:
			wc.rejectRequest({
				id: payload.id,
				error: {message: `${payload.method} not supported!`},
			})
		}
	})
}