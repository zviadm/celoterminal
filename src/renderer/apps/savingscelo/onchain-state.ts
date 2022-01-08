import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import * as React from 'react'
import { savingsToCELO } from 'savingscelo'
import { ABI as UbeFarmABI, IStakingRewards } from 'savingscelo-with-ube/dist/types/web3-v1-contracts/IStakingRewards'

import useOnChainState from '../../state/onchain-state'
import { Account } from '../../../lib/accounts/accounts'
import { newSavingsCELOWithUbeKit } from 'savingscelo-with-ube'
import { addRegisteredErc20 } from '../../state/erc20list-state'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useSavingsOnChainState = (
	account: Account,
	savingsWithUbeAddress: string,
	sCELOUbeFarmAddress?: string) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const goldToken = await kit.contracts.getGoldToken()
			const lockedGold = await kit.contracts.getLockedGold()
			const lockedGoldCfg = lockedGold.getConfig()
			const balance_CELO = goldToken.balanceOf(account.address)
			const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
			const pendingWithdrawals = sKit.savingsKit.pendingWithdrawals(account.address)
			const _liquidityAmount = sKit.liquidityBalanceOf(account.address)
			const reserves = await sKit.reserves()
			const savingsTotals = await sKit.savingsKit.totalSupplies()
			const balance_sCELO = new BigNumber(
				await sKit.savingsKit.contract.methods.balanceOf(account.address).call())
			const sCELOasCELO = savingsToCELO(
				balance_sCELO, savingsTotals.savingsTotal, savingsTotals.celoTotal)
			if (balance_sCELO.gt(0)) {
				addRegisteredErc20("sCELOxDEPRECATED")
			}
			const liquidityTotal_ULP = new BigNumber(await sKit.pair.methods.totalSupply().call())
			const liquidityAmount = await _liquidityAmount
			const liquidity_sCELOasCELO = savingsToCELO(
				liquidityAmount.balance_sCELO, savingsTotals.savingsTotal, savingsTotals.celoTotal)
			const balance_ULPasCELO = liquidityAmount.balance_CELO.plus(liquidity_sCELOasCELO)
			const balance_ULP_CELO_ratio = liquidityAmount.balance_CELO.div(balance_ULPasCELO)

			let farmingBalance_ULP = new BigNumber(0)
			if (sCELOUbeFarmAddress) {
				const ubeFarm = new kit.web3.eth.Contract(UbeFarmABI, sCELOUbeFarmAddress) as unknown as IStakingRewards
				farmingBalance_ULP = await new BigNumber(await ubeFarm.methods.balanceOf(account.address).call())
			}
			const farmingLiquidity_CELO = farmingBalance_ULP.multipliedBy(reserves.reserve_CELO).div(liquidityTotal_ULP).integerValue()
			const farmingLiquidity_sCELO = farmingBalance_ULP.multipliedBy(reserves.reserve_sCELO).div(liquidityTotal_ULP).integerValue()
			const farmingLiquidity_sCELOasCELO = savingsToCELO(
				farmingLiquidity_sCELO, savingsTotals.savingsTotal, savingsTotals.celoTotal)
			const farmingBalance_ULPasCELO = farmingLiquidity_CELO.plus(farmingLiquidity_sCELOasCELO)
			const farmingBalance_ULP_CELO_ratio = farmingLiquidity_CELO.div(farmingBalance_ULPasCELO)

			if (liquidityAmount.liquidity.gt(0) || farmingBalance_ULP.gt(0)) {
				addRegisteredErc20("ULP-CELO+sCELOxDEPRECATED")
			}
			// TODO(zviad): is there alfajores link?
			const ubeswapPoolURL = `https://info.ubeswap.org/pair/${sKit.pair.options.address}`
			const ubeswapFarmURL = `https://app.ubeswap.org/#/farm/${sKit.savingsKit.contractAddress}/${goldToken.address}`
			return {
				pendingWithdrawals: await pendingWithdrawals,
				unlockingPeriod: (await lockedGoldCfg).unlockingPeriod,
				balance_CELO: await balance_CELO,
				balance_sCELO,
				sCELOasCELO,
				liquidityTotal_ULP,
				balance_ULP: liquidityAmount.liquidity,
				balance_ULPasCELO,
				balance_ULP_CELO_ratio,
				farmingBalance_ULP,
				farmingBalance_ULPasCELO,
				farmingBalance_ULP_CELO_ratio,
				ubeReserves: reserves,
				savingsTotals,
				ubeswapPoolURL,
				ubeswapFarmURL,
			}
		},
		[account, savingsWithUbeAddress, sCELOUbeFarmAddress],
	))
}
