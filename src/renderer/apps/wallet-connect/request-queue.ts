import { CeloTx } from "@celo/connect"
import { showWindowAndFocus } from "../../electron-utils"
import { ISession } from "./session"
import { Lock } from '@celo/base/lib/lock'

import { wipeFullStorage as wipeFullStorageV1 } from './v1/storage'
import { initializeStoredSessions as initializeStoredSessionsV1 } from './v1/wc'
import { initializeStoredSessions as initializeStoredSessionsV2 } from './v2/wc'

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
export interface EthSignTypedDataV4 extends BaseRequest {
	method: "eth_signTypedData_v4"
	params: {
		from: string
		data: string
	}
}
export type RequestPayload = EthSendTransaction | EthSignTransaction | EthSignPersonal | EthSignTypedDataV4

export interface IJsonRpcErrorMessage {
	code: number
	message: string
}

export interface WCRequest {
	request: RequestPayload
	reject: (error: IJsonRpcErrorMessage) => void
	approve: (result: unknown) => void
}

export class RequestQueue {
	private sessions: ISession[] = []
	private requests: WCRequest[] = []

	constructor (sessions: ISession[]) {
		this.sessions = [...sessions]
	}

	public sessionsSnapshot = (s: ISession[]) : ISession[] => {
		const matches = (
			s.length === this.sessions.length &&
			s.every((s, idx) => s === this.sessions[idx])
		)
		return matches ? s : [...this.sessions]
	}

	public removeDisconnectedSessions = (): void => {
		const sessions = [...this.sessions]
		sessions.forEach((s) => {
			if (!s.isConnected()) {
				this.rmSession(s)
				s.disconnect()
			}
		})
	}

	public addSession = (s: ISession): void => {
		this.sessions.push(s)
	}

	private rmSession = (s: ISession) => {
		const idx = this.sessions.indexOf(s)
		if (idx >= 0) {
			this.sessions.splice(idx, 1)
		}
	}

	public requestsSnapshot = (r: WCRequest[]): WCRequest[] => {
		const matches = (
			r.length === this.requests.length &&
			r.every((r, idx) => r === this.requests[idx])
		)
		return matches ? r : [...this.requests]
	}

	public pushRequest(req: WCRequest): void {
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

	public approve(req: WCRequest, result: unknown): void {
		this.rmRequest(req)
		req.approve(result)
	}

	public reject(req: WCRequest, error: IJsonRpcErrorMessage): void {
		this.rmRequest(req)
		req.reject(error)
	}

	public requestsN(): number {
		return this.requests.length
	}

	public resetAndRejectAll(): void {
		for (const s of this.sessions) {
			s.disconnect()
		}
		wipeFullStorageV1()
		// NOTE(zviad): No need to wipe V2 storage, assuming it is all synced up.
		for (const r of this.requests) {
			this.reject(r, {code: -32000, message: "Disconnected"})
		}
	}
}

let _requestQueueGlobal: RequestQueue | undefined
const _requestQueueMX = new Lock()
export const requestQueueGlobal = async (): Promise<RequestQueue> => {
	_requestQueueMX.acquire()
	try {
		if (!_requestQueueGlobal) {
			const sessions = [
				...initializeStoredSessionsV1(),
				...(await initializeStoredSessionsV2()),
			]
			_requestQueueGlobal = new RequestQueue(sessions)
		}
		return _requestQueueGlobal
	} finally {
		_requestQueueMX.release()
	}
}

export const requestQueueNotifyN = (): number => {
	if (!_requestQueueGlobal) {
		return 0
	}
	_requestQueueGlobal.removeDisconnectedSessions()
	return _requestQueueGlobal.requestsN()
}
