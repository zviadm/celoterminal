import { ContractKit } from '@celo/contractkit'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import BigNumber from 'bignumber.js'

import useOnChainState from '../../state/onchain-state'
import { Decimals, StableTokens } from './config'
import { Account } from '../../../lib/accounts'

import * as React from 'react'
import useEventHistoryState from '../../state/event-history-state'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useExchangeOnChainState = (account: Account, stableToken: string) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			// TODO(zviadm): handle multi-exchange once it is available.
			const exchange = await kit.contracts.getExchange()
			const goldToken = await kit.contracts.getGoldToken()
			const stableTokenC = await StableTokens[stableToken](kit)

			const celoBalance = goldToken.balanceOf(account.address)
			const stableDecimals = stableTokenC.decimals()
			const stableBalance = stableTokenC.balanceOf(account.address)

			const spread = exchange.spread()
			const buckets = exchange.getBuyAndSellBuckets(true)

			if (await stableDecimals !== Decimals) {
				throw new Error(`Unexpected decimals for ${stableToken}. Expected: ${Decimals} Got: ${stableDecimals}`)
			}
			const [stableBucket, celoBucket] = await buckets
			return {
				celoBalance: await celoBalance,
				stableBalance: await stableBalance,
				spread: await spread,
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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useExchangeHistoryState = (account: Account) => {
	const fetchCallback = React.useCallback(
		async (kit: ContractKit, fromBlock: number, toBlock: number): Promise<TradeEvent[]> => {
			const exchangeDirect = await kit._web3Contracts.getExchange()
			const toBlockP = kit.web3.eth.getBlock(toBlock)
			const events = await exchangeDirect.getPastEvents("Exchanged", {
				fromBlock,
				toBlock,
				filter: { exchanger: account.address }
			})
			const toBlockData = await toBlockP
			return events.map((e) => ({
					blockNumber: e.blockNumber,
					// Estimate timestamp from just `toBlock`, since fetching all blocks
					// would be prohibitevly expensive.
					timestamp: new Date(
						new BigNumber(toBlockData.timestamp)
						.minus((toBlockData.number - e.blockNumber) * 5)
						.multipliedBy(1000).toNumber()),
					txHash: e.transactionHash,
					exchanger: e.returnValues.exchanger,
					sellAmount: valueToBigNumber(e.returnValues.sellAmount),
					buyAmount: valueToBigNumber(e.returnValues.buyAmount),
					soldGold: e.returnValues.soldGold,
			}))
		}, [account],
	)

	return useEventHistoryState(
		fetchCallback, {
			maxHistoryDays: 7,
			maxEvents: 100,
		},
	)
}