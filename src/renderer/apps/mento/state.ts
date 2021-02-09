import useOnChainState from '../../state/onchain-state'
import { Decimals, StableTokens } from './config'
import { Account } from '../../../lib/accounts'

import * as React from 'react'
import { CeloContract, ContractKit } from '@celo/contractkit'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useExchangeOnChainState = (account: Account, stableToken: string) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			// TODO: handle multi-exchange once it is available.
			const exchange = await kit.contracts.getExchange()
			const goldToken = await kit.contracts.getGoldToken()
			const stableTokenC = await StableTokens[stableToken](kit)
			const oracles = await kit.contracts.getSortedOracles()

			const celoBalance = goldToken.balanceOf(account.address)
			const stableDecimals = stableTokenC.decimals()
			const stableBalance = stableTokenC.balanceOf(account.address)

			const spread = exchange.spread()
			const buckets = exchange.getBuyAndSellBuckets(true)

			// TODO: multi-currency handling.
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
