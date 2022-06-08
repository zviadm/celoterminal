import * as React from 'react'
const BigNumber = require('bignumber.js');
import { AbiItem } from '@celo/connect'
import { ContractKit, StableToken } from '@celo/contractkit'
import useOnChainState from '../../state/onchain-state'
import { Account } from '../../../lib/accounts/accounts'
import { abi as LendingPoolAddressesProviderABI } from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json';
import { abi as LendingPoolABI } from '@aave/protocol-v2/artifacts/contracts/protocol/lendingpool/LendingPool.sol/LendingPool.json';
import { abi as LendingPoolDataProviderABI } from '@aave/protocol-v2/artifacts/contracts/misc/AaveProtocolDataProvider.sol/AaveProtocolDataProvider.json';
import { BN, print, printRayRate } from './moola-helper';


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useUserOnChainState = (account: Account, tokenAddress: string) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {

			const goldToken = await kit.contracts.getGoldToken()
			const LendingPoolAddressesProvider = new kit.web3.eth.Contract(LendingPoolAddressesProviderABI as AbiItem[], '0xb3072f5F0d5e8B9036aEC29F37baB70E86EA0018')
			const lendingPoolAddress = await LendingPoolAddressesProvider.methods.getLendingPool().call();
			const priceOracleAddress = await LendingPoolAddressesProvider.methods.getPriceOracle().call();
			const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], lendingPoolAddress)
			const userAccountDataRaw = await LendingPool.methods.getUserAccountData(account.address).call();
			const lendingPoolDataProviderAddress = '0x31ccB9dC068058672D96E92BAf96B1607855822E';
			const LendingPoolDataProvider = new kit.web3.eth.Contract(LendingPoolDataProviderABI as AbiItem[], lendingPoolDataProviderAddress)
			const userReserveDataRaw = await LendingPoolDataProvider.methods.getUserReserveData(tokenAddress, account.address).call()
			const reserveData = await LendingPoolDataProvider.methods.getReserveData(tokenAddress).call();

			const repayDelegationHelperAddress = '0xeEe3D107c387B04A8e07B7732f0ED0f6ED990882' // Alfajores
			const autoRepayAddress = '0x19F8322CaC86623432e9142a349504DE6754f12A' // alfajores
			const liquiditySwapAdapterAddress = '0xe469484419AD6730BeD187c22a47ca38B054B09f' // alfajores


			return {
				goldToken,
				lendingPoolAddress,
				repayDelegationHelperAddress,
				autoRepayAddress,
				lendingPoolDataProviderAddress,
				priceOracleAddress,
				liquiditySwapAdapterAddress,
				userAccountData: formattedUserAccountData(userAccountDataRaw),
				userReserveData: formattedUserReserveData(userReserveDataRaw, reserveData)
			}
		},
		[account, tokenAddress]
	), {})
}

function formattedUserAccountData(data) { // TODO-- add type
	return {
      TotalCollateral: print(data.totalCollateralETH),
      TotalDebt: print(data.totalDebtETH),
      AvailableBorrow: print(data.availableBorrowsETH),
      LiquidationThreshold: `${BN(data.currentLiquidationThreshold).div(BN(100))}%`,
      LoanToValue: `${BN(data.ltv).div(BN(100))}%`,
      HealthFactor: data.healthFactor.length > 30 ? 'SAFE' : print(data.healthFactor),
	}
}

function formattedUserReserveData(userData, reserveData) { // TODO-- add type
	return {
      Deposited: print(userData.currentATokenBalance),
      BorrowedStable: print(userData.principalStableDebt),
      DebtStable: print(userData.currentStableDebt),
      BorrowRateStable: printRayRate(userData.stableBorrowRate),
      BorrowedVariable: print(userData.scaledVariableDebt),
      DebtVariable: print(userData.currentVariableDebt),
      VariableRate: printRayRate(reserveData.variableBorrowRate),
      LiquidityRate: printRayRate(userData.liquidityRate),
      // LastUpdateStable: new Date(
      //   BN(userData.stableRateLastUpdated).multipliedBy(1000).toNumber()
      // ).toLocaleString(),
      IsCollateral: userData.usageAsCollateralEnabled ? 'YES' : 'NO',
    };
}

