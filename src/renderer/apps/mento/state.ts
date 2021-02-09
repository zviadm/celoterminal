import { CeloContract, ContractKit } from '@celo/contractkit'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import BigNumber from 'bignumber.js'
import log from 'electron-log'

import useOnChainState from '../../state/onchain-state'
import { Decimals, StableTokens } from './config'
import { Account } from '../../../lib/accounts'

import * as React from 'react'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useExchangeOnChainState = (account: Account, stableToken: string) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			// TODO(zviadm): handle multi-exchange once it is available.
			const exchange = await kit.contracts.getExchange()
			const goldToken = await kit.contracts.getGoldToken()
			const stableTokenC = await StableTokens[stableToken](kit)
			const oracles = await kit.contracts.getSortedOracles()

			const celoBalance = goldToken.balanceOf(account.address)
			const stableDecimals = stableTokenC.decimals()
			const stableBalance = stableTokenC.balanceOf(account.address)

			const spread = exchange.spread()
			const buckets = exchange.getBuyAndSellBuckets(true)

			// TODO(zviadm): multi-currency handling.
			const oracleRate = oracles.medianRate(CeloContract.StableToken)

			if (await stableDecimals !== Decimals) {
				throw new Error(`Unexpected decimals for ${stableToken}. Expected: ${Decimals} Got: ${stableDecimals}`)
			}
			const [stableBucket, celoBucket] = await buckets
			return {
				celoBalance: await celoBalance,
				stableBalance: await stableBalance,
				spread: await spread,
				oracleRate: await oracleRate,
				celoBucket,
				stableBucket,
			}
		},
		[account, stableToken]
	))
}

export interface TradeEvent {
	blockNumber: number
	timestamp: Date
	txHash: string
	exchanger: string
	sellAmount: BigNumber
	buyAmount: BigNumber
	soldGold: boolean
}

// TODO(zviadm): Factor out helpful `event loading` code as a shared library.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useExchangeHistoryState = (account: Account) => {
	// cache object never changes. it is not used in rendering, just
	// for caching fetched data.
	const [cache] = React.useState<{
		account?: Account,
		toBlock: number,
		events: TradeEvent[],
	}>({toBlock: 0, events: []})

	const maxEvents = 100
	const maxHistoryBlocks = 120960 // 1 week.
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			// TODO(zviadm): multi exchange support.
			const exchangeDirect = await kit._web3Contracts.getExchange()
			const latestBlock = await kit.web3.eth.getBlock("latest")
			const toBlock = latestBlock.number
			let fromBlock
			let cachedEvents: TradeEvent[] = []
			if (cache.account?.address === account.address) {
				fromBlock = cache.toBlock + 1
				cachedEvents = cache.events
			} else {
				fromBlock = Math.max(toBlock - maxHistoryBlocks, 0)
			}

			let events: TradeEvent[] = []
			if (fromBlock <= toBlock) {
				log.info(`exchange[HISTORY]: fetch new events ${fromBlock}..${toBlock}`)
				const r = await progressiveFetch(
					fromBlock,
					toBlock,
					maxEvents,
					(from: number, to: number) => {
						return exchangeDirect.getPastEvents("Exchanged", {
							fromBlock: from,
							toBlock: to,
							filter: {
								exchanger: account.address,
							}})
					}
				)

				events = r.map((e) => ({
					blockNumber: e.blockNumber,
					timestamp: new Date(
						new BigNumber(latestBlock.timestamp)
						.minus((latestBlock.number - e.blockNumber) * 5)
						.multipliedBy(1000).toNumber()),
					txHash: e.transactionHash,
					exchanger: e.returnValues.exchanger,
					sellAmount: valueToBigNumber(e.returnValues.sellAmount),
					buyAmount: valueToBigNumber(e.returnValues.buyAmount),
					soldGold: e.returnValues.soldGold,
				}))
			}
			events.push(...cachedEvents)
			events = events.slice(0, maxEvents)

			cache.account = account
			cache.toBlock = toBlock
			cache.events = events
			return {
				events: events,
			}
		},
		[account, cache],
	))
}

const minFetchSize = 1000
const maxFetchSize = 64 * minFetchSize

async function progressiveFetch<T>(
	fromBlock: number,
	toBlock: number,
	minItems: number,
	fetch: (fromBlock: number, toBlock: number) => Promise<T[]>,
	): Promise<T[]> {
	const all: T[] = []
	let fetchSize = minFetchSize
	let _to = toBlock
	for (;;) {
		const _from = Math.max(fromBlock, _to - fetchSize)
		const events = await fetch(_from, _to)
		all.push(...events.reverse())
		log.info(`[progressive-fetch]: from: ${fromBlock} to: ${toBlock}, items: ${all.length}, _from: ${_from}`)
		if (all.length >= minItems || _from === fromBlock) {
			break
		}
		_to = _from - 1
		fetchSize = Math.min(maxFetchSize, fetchSize *= 2)
	}
	return all.slice(0, minItems)
}