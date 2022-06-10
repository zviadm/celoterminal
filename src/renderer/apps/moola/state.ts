import * as React from 'react'
import { AbiItem } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import useOnChainState from '../../state/onchain-state'
import { Account } from '../../../lib/accounts/accounts'
import { abi as LendingPoolAddressesProviderABI } from './abi/AddressesProvider.json';
import { abi as LendingPoolABI } from './abi/LendingPool.json';
import { abi as LendingPoolDataProviderABI } from './abi/DataProvider.json';
import { BN, print, printRayRate, onChainUserReserveData, onChainUserData, onChainReserveData, userAccountData, userReserveData, reserveData, lendingPoolDataProviderAddresses, lendingPoolAddressesProviderAddresses, autoRepayAddresses, liquiditySwapAdapterAddresses, ubeswapAddresses, repayAdapterAddresses } from './moola-helper';
import { selectAddressOrThrow } from '../../../lib/cfg';

// interface userOnChainState {
// 					goldToken: string,
// 				lendingPoolAddress: string,
// 				autoRepayAddress: string,
// 				lendingPoolDataProviderAddress: string,
// 				priceOracleAddress: string,
// 				liquiditySwapAdapterAddress: string,
// 				ubeswapAddress: string,
// 				repayAdapterAddress: string,
// 				userAccountData: userAccountData
// 				userReserveData: userReserveData
// 				reserveData: reserveData
// }
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useUserOnChainState = (account: Account, tokenAddress: string)  => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {

			const goldToken = await kit.contracts.getGoldToken()
			const lendingPoolAddressesProviderAddress = selectAddressOrThrow(lendingPoolAddressesProviderAddresses)
			const LendingPoolAddressesProvider = new kit.web3.eth.Contract(LendingPoolAddressesProviderABI as AbiItem[], lendingPoolAddressesProviderAddress)
			const lendingPoolAddress = await LendingPoolAddressesProvider.methods.getLendingPool().call();
			const priceOracleAddress = await LendingPoolAddressesProvider.methods.getPriceOracle().call();
			const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], lendingPoolAddress)
			const userAccountDataRaw = await LendingPool.methods.getUserAccountData(account.address).call();
			const lendingPoolDataProviderAddress = selectAddressOrThrow(lendingPoolDataProviderAddresses)
			const LendingPoolDataProvider = new kit.web3.eth.Contract(LendingPoolDataProviderABI as AbiItem[], lendingPoolDataProviderAddress)
			const userReserveDataRaw = await LendingPoolDataProvider.methods.getUserReserveData(tokenAddress, account.address).call()
			const reserveData = await LendingPoolDataProvider.methods.getReserveData(tokenAddress).call();

			const autoRepayAddress = selectAddressOrThrow(autoRepayAddresses)
			const liquiditySwapAdapterAddress = selectAddressOrThrow(liquiditySwapAdapterAddresses)
			const ubeswapAddress = selectAddressOrThrow(ubeswapAddresses)
			const repayAdapterAddress = selectAddressOrThrow(repayAdapterAddresses)

			return {
				goldToken,
				lendingPoolAddress,
				autoRepayAddress,
				lendingPoolDataProviderAddress,
				priceOracleAddress,
				liquiditySwapAdapterAddress,
				ubeswapAddress,
				repayAdapterAddress,
				userAccountData: formattedUserAccountData(userAccountDataRaw),
				userReserveData: formattedUserReserveData(userReserveDataRaw, reserveData),
				reserveData: formattedReserveData(reserveData),
			}
		},
		[account, tokenAddress]
	), {})
}

function formattedUserAccountData(data: onChainUserReserveData): userAccountData {
	return {
      'Total Collateral': print(data.totalCollateralETH),
      'Total Debt': print(data.totalDebtETH),
      'Available Borrow': print(data.availableBorrowsETH),
      'Liquidation Threshold': `${BN(data.currentLiquidationThreshold).div(BN(100))}%`,
      'Loan To Value': `${BN(data.ltv).div(BN(100))}%`,
      'Health Factor': data.healthFactor.length > 30 ? 'SAFE' : print(data.healthFactor),
	}
}

function formattedReserveData(data: onChainReserveData): reserveData {
	return {
    'Available Liquidity': print(data.availableLiquidity),       
  'Total Stable Borrows': print(data.totalStableDebt),    
 'Total Variable Borrows': print(data.totalVariableDebt),        
    'Liquidity Rate': printRayRate(data.liquidityRate),          
     'Variable Borrow Rate': printRayRate(data.variableBorrowRate),            
      'Stable Borrow Rate': printRayRate(data.stableBorrowRate),                
  'Average Stable Rate': printRayRate(data.averageStableBorrowRate),    
	}
}

function formattedUserReserveData(userData: onChainUserData, reserveData: onChainReserveData) : userReserveData {
	return {
		'Deposited': print(userData.currentATokenBalance),
		'Stable Borrow Rate': printRayRate(userData.stableBorrowRate),
		'Variable Borrow Rate': printRayRate(reserveData.variableBorrowRate),
		'Principal Stable Debt': print(userData.principalStableDebt),
		'Current Stable Debt': print(userData.currentStableDebt),
		'Scaled Variable Debt': print(userData.scaledVariableDebt),
		'Current Variable Debt': print(userData.currentVariableDebt),
		'Liquidity Rate': printRayRate(userData.liquidityRate),
		'Is Collateral': userData.usageAsCollateralEnabled ? 'YES' : 'NO',
	};
}