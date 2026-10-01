import { blockWindows, getPastLogs } from "./get-past-logs"
import { MAX_LOG_BLOCK_SPAN, PREFERRED_LOG_BLOCK_SPAN } from "./max-log-span"

test("block windows stay within the span the node accepts", () => {
	const quickNode = blockWindows(0, 25000, PREFERRED_LOG_BLOCK_SPAN)
	for (const [start, end] of quickNode) {
		expect(end - start).toBeLessThanOrEqual(PREFERRED_LOG_BLOCK_SPAN)
	}
	expect(quickNode[0]).toEqual([25000 - PREFERRED_LOG_BLOCK_SPAN, 25000])
	expect(quickNode[quickNode.length - 1][0]).toEqual(0)

	const ankr = blockWindows(100, 2101, MAX_LOG_BLOCK_SPAN)
	for (const [start, end] of ankr) {
		expect(end - start).toBeLessThanOrEqual(MAX_LOG_BLOCK_SPAN)
	}
	expect(ankr).toEqual([
		[1101, 2101],
		[100, 1100],
	])
})

test("dRPC free-plan range errors shrink the window and retry", async () => {
	const spans: number[] = []
	const events = await getPastLogs(async (from, to) => {
		const span = to - from
		spans.push(span)
		if (span > MAX_LOG_BLOCK_SPAN) {
			throw new Error("ranges over 10000 blocks are not supported on free plan")
		}
		return [span]
	}, 0, 2500)
	expect(spans[0]).toBeGreaterThan(MAX_LOG_BLOCK_SPAN)
	expect(spans.slice(1).every((span) => span <= MAX_LOG_BLOCK_SPAN)).toBe(true)
	expect(events.length).toBeGreaterThan(0)
})
