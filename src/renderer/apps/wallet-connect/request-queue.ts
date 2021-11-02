import { CeloTx } from "@celo/connect"
import { showWindowAndFocus } from "../../electron-utils"

if (module.hot) {
	module.hot.decline()
}

export interface IJsonRpcErrorMessage {
	code?: number
	message: string
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

export interface WCRequest {
	request: RequestPayload
	reject: (error: IJsonRpcErrorMessage) => void
	approve: (result: unknown) => void
}

class RequestQueue {
	private requests: WCRequest[] = []

	public snapshot = () => {
		return [...this.requests]
	}

	public matchesSnapshot(s: WCRequest[]) {
		const matches = (
			s.length === this.requests.length &&
			s.every((r, idx) => r === this.requests[idx])
		)
		return matches
	}

	public pushRequest(req: WCRequest) {
		this.requests.push(req)
		showWindowAndFocus()
	}

	private rmRequest(req: WCRequest) {
		const idx = this.requests.indexOf(req)
		if (idx >= 0) {
			this.requests.splice(idx, 1)
		}
	}

	public requestFor(address: string): WCRequest | undefined {
		return this.requests.find((r) =>
			r.request.params?.from?.toString().toLowerCase() === address.toLowerCase())
	}

	public approve(req: WCRequest, result: unknown) {
		this.rmRequest(req)
		req.approve(result)
	}

	public reject(req: WCRequest, error: IJsonRpcErrorMessage) {
		this.rmRequest(req)
		req.reject(error)
	}

	public rejectAll(error: IJsonRpcErrorMessage) {
		for (const r of this.requests) {
			this.reject(r, error)
		}
	}

	public requestsN() {
		return this.requests.length
	}
}

export const requestQueueGlobal = new RequestQueue()