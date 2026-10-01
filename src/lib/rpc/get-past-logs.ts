import { MAX_LOG_BLOCK_SPAN, PREFERRED_LOG_BLOCK_SPAN } from "./max-log-span"
import { errorMessage, isRangeLimit } from "./rpc-errors"

const WINDOWS_PER_GROUP = 2
const MAX_IN_FLIGHT = 2

let logBlockSpan = PREFERRED_LOG_BLOCK_SPAN
let inFlight = 0
const waiters: Array<() => void> = []

export function blockWindows(
	fromBlock: number,
	toBlock: number,
	span: number,
): Array<[number, number]> {
	if (span < 1) {
		throw new Error(`log span must be positive, got ${span}`)
	}
	if (fromBlock > toBlock) {
		return []
	}
	const windows: Array<[number, number]> = []
	for (let end = toBlock; end >= fromBlock;) {
		const start = Math.max(fromBlock, end - span)
		windows.push([start, end])
		if (start === fromBlock) {
			break
		}
		end = start - 1
	}
	return windows
}

// Fetch logs across [fromBlock, toBlock], newest windows first.
// Each eth_getLogs uses a span the current node accepts. Stops once maxEvents
// are collected so a busy account does not scan the whole lookback.
export async function getPastLogs<T>(
	fetchWindow: (fromBlock: number, toBlock: number) => Promise<T[]>,
	fromBlock: number,
	toBlock: number,
	opts?: {
		maxEvents?: number,
		isCancelled?: () => boolean,
	},
): Promise<T[]> {
	const events: T[] = []
	let cursor = toBlock
	while (cursor >= fromBlock) {
		if (opts?.isCancelled?.()) {
			break
		}
		const span = logBlockSpan
		const group: Array<[number, number]> = []
		let next = cursor
		for (let i = 0; i < WINDOWS_PER_GROUP && next >= fromBlock; i++) {
			const start = Math.max(fromBlock, next - span)
			group.push([start, next])
			next = start === fromBlock ? fromBlock - 1 : start - 1
		}
		try {
			const parts = await Promise.all(group.map(([start, end]) =>
				withSlot(() => fetchWindow(start, end))))
			for (const part of parts) {
				events.push(...part)
			}
			cursor = next
			if (opts?.maxEvents !== undefined && events.length >= opts.maxEvents) {
				break
			}
		} catch (e) {
			if (isRangeLimit(errorMessage(e)) && span > MAX_LOG_BLOCK_SPAN) {
				logBlockSpan = MAX_LOG_BLOCK_SPAN
				continue
			}
			throw e
		}
	}
	return events
}

function withSlot<T>(fn: () => Promise<T>): Promise<T> {
	const run = async () => {
		inFlight++
		try {
			return await fn()
		} finally {
			inFlight--
			waiters.shift()?.()
		}
	}
	if (inFlight < MAX_IN_FLIGHT) {
		return run()
	}
	return new Promise((resolve, reject) => {
		waiters.push(() => {
			run().then(resolve, reject)
		})
	})
}

