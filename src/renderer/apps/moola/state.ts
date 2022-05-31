import { ContractKit, StableToken } from '@celo/contractkit'
// import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
// import BigNumber from 'bignumber.js'
import { BlockTransactionString } from 'web3-eth'
import { coreErc20s, coreErc20Decimals, RegisteredErc20 } from '../../../lib/erc20/core'

import useOnChainState from '../../state/onchain-state'
import { Account } from '../../../lib/accounts/accounts'
const BigNumber = require('bignumber.js');
import * as React from 'react'
import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'
import { AbiItem } from '@celo/connect'
import { abi as LendingPoolAddressesProviderABI } from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json';
import { abi as LendingPoolABI } from '@aave/protocol-v2/artifacts/contracts/protocol/lendingpool/LendingPool.sol/LendingPool.json';
import { abi as LendingPoolDataProviderABI } from '@aave/protocol-v2/artifacts/contracts/misc/AaveProtocolDataProvider.sol/AaveProtocolDataProvider.json';
import { useErc20List } from '../../state/erc20list-state'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useUserOnChainState = (account: Account, tokenAddress: string) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {

			const goldToken = await kit.contracts.getGoldToken()
			const LendingPoolAddressesProvider = new kit.web3.eth.Contract(LendingPoolAddressesProviderABI as AbiItem[], '0xb3072f5F0d5e8B9036aEC29F37baB70E86EA0018')
			const lendingPoolAddress = await LendingPoolAddressesProvider.methods.getLendingPool().call();
			const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], lendingPoolAddress)
			const userAccountDataRaw = await LendingPool.methods.getUserAccountData(account.address).call();
			const LendingPoolDataProvider = new kit.web3.eth.Contract(LendingPoolDataProviderABI as AbiItem[], '0x31ccB9dC068058672D96E92BAf96B1607855822E')
			const userReserveDataRaw = await LendingPoolDataProvider.methods.getUserReserveData(tokenAddress, account.address).call()
			const reserveData = await LendingPoolDataProvider.methods.getReserveData(tokenAddress).call();

			return {
				goldToken,
				lendingPoolAddress,
				userAccountData: formattedUserAccountData(userAccountDataRaw),
				userReserveData: formattedUserReserveData(userReserveDataRaw, reserveData)
			}
		},
		[account, tokenAddress]
	), {
		// Faster constant refetch to continue updating the exchange rate.
		autoRefetchSecs: 20,
	})
}

function formattedUserAccountData(data) { // TODO-- add type
	return {
		 TotalCollateral: data.totalCollateralETH,
      TotalDebt: data.totalDebtETH,
      AvailableBorrow: data.availableBorrowsETH,
      LiquidationThreshold: `${new BigNumber(data.currentLiquidationThreshold).div(new BigNumber(100))}%`,
      LoanToValue: `${new BigNumber(data.ltv).div(new BigNumber(100))}%`,
      HealthFactor: data.healthFactor.length > 30 ? 'SAFE' : data.healthFactor,
	}
}

function formattedUserReserveData(userData, reserveData) { // TODO-- add type
	return {
      deposited:userData.currentATokenBalance,
      borrowedStable:userData.principalStableDebt,
      debtStable:userData.currentStableDebt,
      borrowRateStable: userData.stableBorrowRate,
      borrowedVariable:userData.scaledVariableDebt,
      debtVariable:userData.currentVariableDebt,
      variableRate: reserveData.variableBorrowRate,
			liquidityRate: userData.liquidityRate,
			LastUpdateStable: new Date(
        new BigNumber(userData.stableRateLastUpdated).multipliedBy(1000).toNumber()
      ).toLocaleString(),
      isCollateral: userData.usageAsCollateralEnabled,
    };
}