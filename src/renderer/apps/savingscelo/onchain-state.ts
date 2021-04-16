import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import * as React from 'react'
import { savingsToCELO } from 'savingscelo'

import useOnChainState from '../../state/onchain-state'
import { Account } from '../../../lib/accounts/accounts'
import { newSavingsCELOWithUbeKit } from 'savingscelo-with-ube'
import { addRegisteredErc20 } from '../../state/erc20list-state'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useSavingsOnChainState = (account: Account, savingsWithUbeAddress: string) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const goldToken = await kit.contracts.getGoldToken()
			const lockedGold = await kit.contracts.getLockedGold()
			const lockedGoldCfg = lockedGold.getConfig()
			const balance_CELO = goldToken.balanceOf(account.address)
			const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
			const reserves = sKit.reserves()
			const pendingWithdrawals = sKit.savingsKit.pendingWithdrawals(account.address)
			const _liquidityAmount = sKit.liquidityBalanceOf(account.address)
			const savingsTotals = await sKit.savingsKit.totalSupplies()
			const balance_sCELO = new BigNumber(
				await sKit.savingsKit.contract.methods.balanceOf(account.address).call())
			const sCELOasCELO = savingsToCELO(
				balance_sCELO, savingsTotals.savingsTotal, savingsTotals.celoTotal)
			if (balance_sCELO.gt(0)) {
				addRegisteredErc20("sCELO")
			}
			const liquidityTotal_ULP = new BigNumber(await sKit.pair.methods.totalSupply().call())
			const liquidityAmount = await _liquidityAmount
			if (liquidityAmount.liquidity.gt(0)) {
				addRegisteredErc20("ULP-CELO+sCELO")
			}
			const liquidityTotal_sCELOasCELO = savingsToCELO(
				liquidityAmount.balance_sCELO, savingsTotals.savingsTotal, savingsTotals.celoTotal)
			const liquidityTotal_CELO = liquidityAmount.balance_CELO.plus(liquidityTotal_sCELOasCELO)
			const liquidityRatio_CELO = liquidityAmount.balance_CELO.div(liquidityTotal_CELO)
			// TODO(zviad): is there alfajores link?
			const ubeswapPoolURL = `https://info.ubeswap.org/pair/${sKit.pair.options.address}`
			return {
				pendingWithdrawals: await pendingWithdrawals,
				unlockingPeriod: (await lockedGoldCfg).unlockingPeriod,
				balance_CELO: await balance_CELO,
				balance_sCELO,
				sCELOasCELO,
				balance_ULP: liquidityAmount.liquidity,
				liquidityTotal_ULP,
				liquidityTotal_CELO,
				liquidityRatio_CELO,
				ubeReserves: await reserves,
				savingsTotals,
				ubeswapPoolURL,
			}
		},
		[account, savingsWithUbeAddress],
	))
}
