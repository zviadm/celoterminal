import * as React from 'react'
import log from 'electron-log'
import { ContractKit } from '@celo/contractkit'
import { BlockTransactionString } from 'web3-eth'

import useOnChainState from './onchain-state'
import BigNumber from 'bignumber.js'
import { CancelPromise } from '../../lib/utils'

export type FetchEventsCallback<T> = (
	kit: ContractKit,
	fromBlock: number,
	toBlock: number,
	latestBlock: BlockTransactionString) => Promise<T[]>

// useEventHistoryState provides React hook to help with fetching recent events
// from the blockchain.
// fetchCallback requirements:
// * must be wrapped in React.useCallback to be memoized based on its dependencies.
// * expected to use .getPastEvents to get desired events and is expected to return same data
//   when called with the same fromBlock/toBlock parameters.
// * must return data ordered from oldest to latest.
//
// maxHistoryDays and maxEvents can be used to control amount of recent data that gets fetched.
// maxHistoryDays >7 can take few seconds to fetch, so it can become pretty expensive.
//
// useEventHistoryState maintains internal cache for fetched events, thus when a `refetch` is called
// only new blocks will be fetched, keeping event history performant as long as `fetchCallback` remains
// unchanged.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function useEventHistoryState <T>(
	fetchCallback: FetchEventsCallback<T>,
	opts: {
		maxHistoryDays: number,
		maxEvents: number,
		noErrorPropagation?: boolean,
	},
) {
	// cache object never changes. it is not used in rendering, just
	// for caching fetched data.
	const [cache] = React.useState<{
		callback?: FetchEventsCallback<T>,
		toBlock: number,
		events: T[],
	}>({toBlock: 0, events: []})

	const maxEvents = opts.maxEvents
	const maxHistoryBlocks = opts.maxHistoryDays * 24 * 60 * 12
	return useOnChainState(React.useCallback(
		async (kit: ContractKit, c: CancelPromise) => {
			const latestBlock = await kit.web3.eth.getBlock("latest")
			const toBlock = latestBlock.number
			let fromBlock
			let cachedEvents: T[] = []
			if (cache.callback === fetchCallback &&
				cache.toBlock > toBlock - maxHistoryBlocks) {
				fromBlock = cache.toBlock + 1
				cachedEvents = cache.events
			} else {
				fromBlock = Math.max(toBlock - maxHistoryBlocks, 0)
			}

			let events: T[] = []
			if (fromBlock <= toBlock) {
				log.info(`exchange[HISTORY]: fetch new events ${fromBlock}..${toBlock}`)
				events = await progressiveFetch(
					fromBlock, toBlock, maxEvents,
					(fromBlock, toBlock) => {
						return fetchCallback(kit, fromBlock, toBlock, latestBlock)
					},
					c,
				)
			}
			events.push(...cachedEvents)
			events = events.slice(0, maxEvents)

			cache.callback = fetchCallback
			cache.toBlock = toBlock
			cache.events = events
			return events
		},
		[fetchCallback, cache, maxEvents, maxHistoryBlocks],
	),
	{noErrorPropagation: opts.noErrorPropagation})
}

const minFetchSize = 1000
const maxFetchSize = 64 * minFetchSize

async function progressiveFetch<T>(
	fromBlock: number,
	toBlock: number,
	minItems: number,
	fetch: (fromBlock: number, toBlock: number) => Promise<T[]>,
	c?: CancelPromise,
	): Promise<T[]> {
	const all: T[] = []
	let fetchSize = minFetchSize
	let _to = toBlock
	for (;;) {
		const _from = Math.max(fromBlock, _to - fetchSize)
		const events = await fetch(_from, _to)
		all.push(...events.reverse())
		log.info(`[progressive-fetch]: from: ${fromBlock} to: ${toBlock}, items: ${all.length}, _from: ${_from}`)
		if (all.length >= minItems || _from === fromBlock || c?.isCancelled()) {
			break
		}
		_to = _from - 1
		fetchSize = Math.min(maxFetchSize, fetchSize *= 2)
	}
	return all.slice(0, minItems)
}

export const estimateTimestamp = (block: BlockTransactionString, blockN: number): Date => {
	return new Date(
		new BigNumber(block.timestamp)
		.minus((block.number - blockN) * 5)
		.multipliedBy(1000).toNumber())
}