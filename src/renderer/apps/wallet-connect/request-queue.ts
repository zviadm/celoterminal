import { CeloTx } from "@celo/connect"
import { showWindowAndFocus } from "../../electron-utils"
import { ISession } from "./session"

import { wipeFullStorage as wipeFullStorageV1 } from './v1/storage'
import { initializeStoredSessions as initializeStoredSessionsV1 } from './v1/wc'

if (module.hot) {
	module.hot.decline()
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
export interface EthSignPersonal extends BaseRequest {
	method: "eth_signPersonal"
	params: {
		from: string
		data: string
	}
}
export type RequestPayload = EthSendTransaction | EthSignTransaction | EthSignPersonal

export interface IJsonRpcErrorMessage {
	code?: number
	message: string
}

export interface WCRequest {
	request: RequestPayload
	reject: (error: IJsonRpcErrorMessage) => void
	approve: (result: unknown) => void
}

class RequestQueue {
	private sessions: ISession[] = []
	private requests: WCRequest[] = []

	constructor (sessions: ISession[]) {
		this.sessions = [...sessions]
	}

	public sessionsSnapshot = (s: ISession[]) => {
		const matches = (
			s.length === this.sessions.length &&
			s.every((s, idx) => s === this.sessions[idx])
		)
		return matches ? s : [...this.sessions]
	}

	public removeDisconnectedSessions = () => {
		this.sessions.forEach((s) => {
			if (!s.isConnected()) {
				s.disconnect()
			}
		})
	}

	public addSession = (s: ISession) => {
		this.sessions.push(s)
	}

	public rmSession = (s: ISession) => {
		const idx = this.sessions.indexOf(s)
		if (idx >= 0) {
			this.sessions.splice(idx, 1)
		}
	}

	public requestsSnapshot = (r: WCRequest[]) => {
		const matches = (
			r.length === this.requests.length &&
			r.every((r, idx) => r === this.requests[idx])
		)
		return matches ? r : [...this.requests]
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

	public requestsN() {
		return this.requests.length
	}

	public resetAndRejectAll() {
		for (const s of this.sessions) {
			s.disconnect()
		}
		wipeFullStorageV1()
		for (const r of this.requests) {
			this.reject(r, {code: -32000, message: "Disconnected"})
		}
	}
}

let _requestQueueGlobal: RequestQueue | undefined
export const requestQueueGlobal = (): RequestQueue => {
	if (!_requestQueueGlobal) {
		const sessions = [
			...initializeStoredSessionsV1(),
		]
		_requestQueueGlobal = new RequestQueue(sessions)
	}
	return _requestQueueGlobal
}

export const requestQueueNotifyN = (): number => {
	const r = requestQueueGlobal()
	r.removeDisconnectedSessions()
	return r.requestsN()
}
