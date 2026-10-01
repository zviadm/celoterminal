export function errorMessage(e: unknown): string {
	if (e instanceof Error) {
		return e.message
	}
	if (typeof e === "object" && e !== null && "message" in e) {
		const message = (e as {message: unknown}).message
		if (typeof message === "string") {
			return message
		}
	}
	return String(e)
}

// Public Celo RPCs reject eth_getLogs windows with different wording for the same limit.
export function isRangeLimit(message: string): boolean {
	return /limited to a\s+[\d,]+\s+range/i.test(message) ||
		/block range is too large/i.test(message) ||
		/exceeded maximum block range/i.test(message) ||
		/query exceeds max block range/i.test(message) ||
		/ranges over\s+[\d,]+\s+blocks/i.test(message)
}

// dRPC's free plan also returns "the method eth_* does not exist/is not available"
// when the caller is over its rate limit. That is not a missing method.
export function isTransientRpcError(message: string): boolean {
	return /rate limit/i.test(message) ||
		/too many requests/i.test(message) ||
		/request limit/i.test(message) ||
		/does not exist\/is not available/i.test(message) ||
		/\b429\b/.test(message) ||
		/timeout/i.test(message) ||
		/ECONNRESET|ETIMEDOUT|ENETUNREACH|Failed to fetch|fetch failed/i.test(message)
}
