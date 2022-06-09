import * as React from 'react'
import { AbiItem } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import useOnChainState from '../../state/onchain-state'
import { Account } from '../../../lib/accounts/accounts'
import { abi as LendingPoolAddressesProviderABI } from './abi/AddressesProvider.json';
import { abi as LendingPoolABI } from './abi/LendingPool.json';
import { abi as LendingPoolDataProviderABI } from './abi/DataProvider.json';
import { BN, print, printRayRate, onChainUserReserveData, onChainUserData, onChainReserveData, userAccountData, userReserveData } from './moola-helper';


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


			const autoRepayAddress = '0x19F8322CaC86623432e9142a349504DE6754f12A' // alfajores
			const liquiditySwapAdapterAddress = '0xe469484419AD6730BeD187c22a47ca38B054B09f' // alfajores
			const ubeswapAddress = '0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121' // alfajores
			const repayAdapterAddress = '0x55a48631e4ED42D2b12FBA0edc7ad8F66c28375C'



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
				userReserveData: formattedUserReserveData(userReserveDataRaw, reserveData)
			}
		},
		[account, tokenAddress]
	), {})
}

function formattedUserAccountData(data: onChainUserReserveData) : userAccountData {
	return {
      'Total Collateral': print(data.totalCollateralETH),
      'Total Debt': print(data.totalDebtETH),
      'Available Borrow': print(data.availableBorrowsETH),
      'Liquidation Threshold': `${BN(data.currentLiquidationThreshold).div(BN(100))}%`,
      'Loan To Value': `${BN(data.ltv).div(BN(100))}%`,
      'Health Factor': data.healthFactor.length > 30 ? 'SAFE' : print(data.healthFactor),
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
		'Current Varable Debt': print(userData.currentVariableDebt),
		'Liquidity Rate': printRayRate(userData.liquidityRate),
		'Is Collateral': userData.usageAsCollateralEnabled ? 'YES' : 'NO',
	};
}