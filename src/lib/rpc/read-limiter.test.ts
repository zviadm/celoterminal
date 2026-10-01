import { activeRpcURL, installReadLimiter, resetReadLimiterForTests } from "./read-limiter"

beforeEach(() => {
	resetReadLimiterForTests()
})

const rejected = {error: {message: "the method eth_call does not exist/is not available"}}

test("uses the next public node when the selected one rejects the call", async () => {
	const seen: string[] = []
	const provider = {
		host: "https://celo.drpc.org",
		send: function (this: {host?: string}, _payload: unknown, callback: (error: Error | null, result?: unknown) => void) {
			seen.push(this.host || "")
			if (this.host?.includes("drpc")) {
				callback(null, rejected)
				return
			}
			callback(null, {result: "0x28"})
		},
	}
	installReadLimiter(provider, ["https://forno.celo.org"])
	const result = await send(provider, {method: "eth_call"})
	expect(result).toEqual({result: "0x28"})
	expect(seen).toEqual(["https://celo.drpc.org", "https://forno.celo.org"])
	expect(activeRpcURL()).toBe("https://forno.celo.org")
})

test("does not retry the block-number health check", async () => {
	let calls = 0
	const provider = {
		host: "https://celo.drpc.org",
		send: (_payload: unknown, callback: (error: Error | null, result?: unknown) => void) => {
			calls++
			callback(null, {error: {message: "the method eth_blockNumber does not exist/is not available"}})
		},
	}
	installReadLimiter(provider, ["https://forno.celo.org"])
	const result = await send(provider, {method: "eth_blockNumber"})
	expect(result).toEqual({error: {message: "the method eth_blockNumber does not exist/is not available"}})
	expect(calls).toBe(1)
	expect(provider.host).toBe("https://celo.drpc.org")
})

test("does not change nodes for a log range error", async () => {
	let logs = 0
	const provider = {
		host: "https://celo.drpc.org",
		send: (_payload: unknown, callback: (error: Error | null, result?: unknown) => void) => {
			logs++
			callback(null, {error: {message: "ranges over 10000 blocks are not supported on free plan"}})
		},
	}
	installReadLimiter(provider, ["https://forno.celo.org"])
	await send(provider, {method: "eth_getLogs"})
	expect(logs).toBe(1)
	expect(provider.host).toBe("https://celo.drpc.org")
})

test("broadcasts a rejected send through the next node and does not resend after a timeout", async () => {
	const seen: string[] = []
	const provider = {
		host: "https://celo.drpc.org",
		send: function (this: {host?: string}, payload: unknown, callback: (error: Error | null, result?: unknown) => void) {
			const method = (payload as {method: string}).method
			seen.push(`${method}@${this.host}`)
			if (method === "eth_sendRawTransaction" && this.host?.includes("drpc")) {
				callback(null, {error: {message: "the method eth_sendRawTransaction does not exist/is not available"}})
				return
			}
			if (method === "eth_sendRawTransaction") {
				callback(new Error("Connection timeout after 30000ms"), undefined)
				return
			}
			callback(null, {result: "0xabc"})
		},
	}
	installReadLimiter(provider, ["https://forno.celo.org"])
	await expect(send(provider, {method: "eth_sendRawTransaction"})).rejects.toThrow(/timeout/)
	expect(seen).toEqual([
		"eth_sendRawTransaction@https://celo.drpc.org",
		"eth_sendRawTransaction@https://forno.celo.org",
	])
})

function send(
	provider: {send: (payload: unknown, callback: (error: Error | null, result?: unknown) => void) => void},
	payload: {method: string},
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		provider.send(payload, (error, result) => {
			if (error) {
				reject(error)
				return
			}
			resolve(result)
		})
	})
}
