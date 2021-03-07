import { ContractKit } from '@celo/contractkit'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import BigNumber from 'bignumber.js'
import { BlockTransactionString } from 'web3-eth'

import useOnChainState from '../../state/onchain-state'
import { getExchange, getExchangeWeb3, getStableToken } from './config'
import { Account } from '../../../lib/accounts/accounts'
import { CoreErc20 } from '../../../lib/erc20/core'

import * as React from 'react'
import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useExchangeOnChainState = (account: Account, stableToken: CoreErc20) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const exchange = await getExchange(kit, stableToken)
			const goldToken = await kit.contracts.getGoldToken()
			const stableTokenC = await getStableToken(kit, stableToken)

			const celoBalance = goldToken.balanceOf(account.address)
			const stableBalance = stableTokenC.balanceOf(account.address)

			const spread = exchange.spread()
			const buckets = exchange.getBuyAndSellBuckets(true)

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
export const useExchangeHistoryState = (account: Account, stableToken: CoreErc20) => {
	const fetchCallback = React.useCallback(
		async (
			kit: ContractKit,
			fromBlock: number,
			toBlock: number,
			latestBlock: BlockTransactionString): Promise<TradeEvent[]> => {
			const exchangeDirect = await getExchangeWeb3(kit, stableToken)
			const events = await exchangeDirect.getPastEvents("Exchanged", {
				fromBlock,
				toBlock,
				filter: { exchanger: account.address }
			})
			return events.map((e) => ({
					blockNumber: e.blockNumber,
					// Estimate timestamp from just `latestBlock`, since fetching all blocks
					// would be prohibitevly expensive.
					timestamp: estimateTimestamp(latestBlock, e.blockNumber),
					txHash: e.transactionHash,
					exchanger: e.returnValues.exchanger,
					sellAmount: valueToBigNumber(e.returnValues.sellAmount),
					buyAmount: valueToBigNumber(e.returnValues.buyAmount),
					soldGold: e.returnValues.soldGold,
			}))
		}, [account, stableToken],
	)

	return useEventHistoryState(
		fetchCallback, {
			maxHistoryDays: 7,
			maxEvents: 100,
		},
	)
}