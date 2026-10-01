import log from "electron-log"

import { errorMessage, isRangeLimit, isTransientRpcError } from "./rpc-errors"

const MAX_IN_FLIGHT = 1
const MIN_GAP_MS = 250

// Public Celo mainnet endpoints that answered eth_chainId and eth_call.
// https://rpc.celo-community.org is the validator gateway; it timed out from
// this network, so it is not in the list. The configured node is always tried first.
export const CELO_MAINNET_FALLBACKS = [
	"https://forno.celo.org",
	"https://rpc.ankr.com/celo",
	"https://celo.publicnode.com",
	"https://celo-json-rpc.stakely.io",
	"https://1rpc.io/celo",
]

const READ_METHODS = new Set([
	"eth_blockNumber",
	"eth_call",
	"eth_chainId",
	"eth_estimateGas",
	"eth_feeHistory",
	"eth_gasPrice",
	"eth_getBalance",
	"eth_getBlockByHash",
	"eth_getBlockByNumber",
	"eth_getCode",
	"eth_getLogs",
	"eth_getTransactionByHash",
	"eth_getTransactionCount",
	"eth_getTransactionReceipt",
	"eth_syncing",
	"net_version",
])

const WRITE_METHODS = new Set([
	"eth_sendRawTransaction",
	"eth_sendTransaction",
])

// The connection indicator polls this. It follows whichever host the last
// successful read selected, and a failure here does not move that host.
const HEALTH_METHODS = new Set([
	"eth_blockNumber",
])

type RpcCallback = (error: Error | null, result?: unknown) => void

interface CallbackProvider {
	host?: string
	// HttpProvider.send is typed with a concrete payload. any keeps this wrapper
	// assignable without pretending every provider shares one payload type.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	send: (payload: any, callback: RpcCallback) => void
}

let inFlight = 0
let nextStartAt = 0
let activeHost: string | undefined
const waiters: Array<() => void> = []
const installed = new WeakSet<object>()

export function activeRpcURL(): string | undefined {
	return activeHost
}

export function resetReadLimiterForTests(): void {
	inFlight = 0
	nextStartAt = 0
	activeHost = undefined
	waiters.length = 0
}

// Reads go out one at a time. When the current node rejects a read or a send
// with a rate limit or dRPC's fake "method does not exist", the next public
// mainnet node is used. A log-range error stays on the same node so the caller
// can shrink the window. A send is not repeated after a timeout.
export function installReadLimiter(provider: CallbackProvider, fallbacks: string[] = []): void {
	if (installed.has(provider)) {
		return
	}
	installed.add(provider)
	const hosts = hostList(provider.host, fallbacks)
	let hostIndex = 0
	if (hosts.length > 0) {
		provider.host = hosts[0]
		activeHost = hosts[0]
	}
	const original = provider.send.bind(provider)
	const moveToNextHost = (method: string, message: string): boolean => {
		if (hosts.length < 2) {
			return false
		}
		const from = hosts[hostIndex]
		hostIndex = (hostIndex + 1) % hosts.length
		const next = hosts[hostIndex]
		provider.host = next
		activeHost = next
		log.warn(`rpc: ${from} rejected ${method} (${message}). Using ${next}`)
		return true
	}

	provider.send = (payload, callback) => {
		const kind = payloadKind(payload)
		if (kind === "write") {
			sendWrite(original, payload, callback, hosts.length || 1, moveToNextHost)
			return
		}
		if (kind !== "read") {
			original(payload, callback)
			return
		}
		if (isHealthCheck(payload)) {
			sendOnce(original, payload, callback)
			return
		}
		sendRead(original, payload, callback, hosts.length || 1, moveToNextHost)
	}
}

function sendOnce(
	original: CallbackProvider["send"],
	payload: unknown,
	callback: RpcCallback,
): void {
	acquire()
		.then(() => waitTurn())
		.then(() => {
			original(payload, (error, result) => {
				release()
				callback(error, result)
			})
		})
		.catch((e) => {
			release()
			callback(asError(e))
		})
}

function sendRead(
	original: CallbackProvider["send"],
	payload: unknown,
	callback: RpcCallback,
	triesLeft: number,
	moveToNextHost: (method: string, message: string) => boolean,
): void {
	acquire()
		.then(() => waitTurn())
		.then(() => new Promise<{error: Error | null, result?: unknown}>((resolve) => {
			original(payload, (error, result) => resolve({error, result}))
		}))
		.then(({error, result}) => {
			const message = rpcFailureMessage(error, result)
			const failover = message !== undefined &&
				shouldFailover(message, "read") &&
				triesLeft > 1 &&
				moveToNextHost(methodLabel(payload), message)
			release()
			if (failover) {
				sendRead(original, payload, callback, triesLeft - 1, moveToNextHost)
				return
			}
			callback(error, result)
		})
		.catch((e) => {
			release()
			callback(asError(e))
		})
}

function sendWrite(
	original: CallbackProvider["send"],
	payload: unknown,
	callback: RpcCallback,
	triesLeft: number,
	moveToNextHost: (method: string, message: string) => boolean,
): void {
	waitTurn()
		.then(() => new Promise<{error: Error | null, result?: unknown}>((resolve) => {
			original(payload, (error, result) => resolve({error, result}))
		}))
		.then(({error, result}) => {
			const message = rpcFailureMessage(error, result)
			if (message !== undefined &&
				shouldFailover(message, "write") &&
				triesLeft > 1 &&
				moveToNextHost(methodLabel(payload), message)) {
				sendWrite(original, payload, callback, triesLeft - 1, moveToNextHost)
				return
			}
			callback(error, result)
		})
		.catch((e) => {
			callback(asError(e))
		})
}

function shouldFailover(message: string, kind: "read" | "write"): boolean {
	if (isRangeLimit(message) || !isTransientRpcError(message)) {
		return false
	}
	// A timed-out send may already be in the mempool.
	if (kind === "write" && /timeout/i.test(message)) {
		return false
	}
	return true
}

function hostList(primary: string | undefined, fallbacks: string[]): string[] {
	const hosts: string[] = []
	const seen = new Set<string>()
	for (const url of [primary, ...fallbacks]) {
		if (!url) {
			continue
		}
		const key = url.replace(/\/+$/, "")
		if (seen.has(key)) {
			continue
		}
		seen.add(key)
		hosts.push(key)
	}
	return hosts
}

function isHealthCheck(payload: unknown): boolean {
	const methods = methodsOf(payload)
	return methods.length > 0 && methods.every((method) => HEALTH_METHODS.has(method))
}

function methodsOf(payload: unknown): string[] {
	return (Array.isArray(payload) ? payload : [payload]).map(methodOf)
}

function methodLabel(payload: unknown): string {
	return methodsOf(payload).filter((method) => method !== "").join(",") || "request"
}

function payloadKind(payload: unknown): "read" | "write" | "other" {
	const methods = methodsOf(payload)
	if (methods.length === 0 || methods.some((method) => method === "")) {
		return "other"
	}
	if (methods.some((method) => WRITE_METHODS.has(method))) {
		return "write"
	}
	if (methods.every((method) => READ_METHODS.has(method))) {
		return "read"
	}
	return "other"
}

function methodOf(payload: unknown): string {
	if (typeof payload === "object" && payload !== null && "method" in payload) {
		const method = (payload as {method: unknown}).method
		if (typeof method === "string") {
			return method
		}
	}
	return ""
}

function rpcFailureMessage(error: Error | null, result: unknown): string | undefined {
	if (error) {
		return errorMessage(error)
	}
	const items = Array.isArray(result) ? result : [result]
	for (const item of items) {
		if (typeof item === "object" && item !== null && "error" in item) {
			const rpcError = (item as {error: unknown}).error
			if (rpcError) {
				return errorMessage(rpcError)
			}
		}
	}
	return undefined
}

function waitTurn(): Promise<void> {
	const now = Date.now()
	const startAt = Math.max(now, nextStartAt)
	nextStartAt = startAt + MIN_GAP_MS
	const wait = startAt - now
	if (wait <= 0) {
		return Promise.resolve()
	}
	return sleep(wait)
}

function acquire(): Promise<void> {
	if (inFlight < MAX_IN_FLIGHT) {
		inFlight++
		return Promise.resolve()
	}
	return new Promise((resolve) => {
		waiters.push(() => {
			inFlight++
			resolve()
		})
	})
}

function release(): void {
	inFlight = Math.max(0, inFlight - 1)
	const next = waiters.shift()
	if (next) {
		next()
	}
}

function asError(e: unknown): Error {
	return e instanceof Error ? e : new Error(errorMessage(e))
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
