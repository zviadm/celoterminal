import BigNumber from 'bignumber.js'
import { coreErc20Decimals, Erc20InfiniteAmount, RegisteredErc20 } from '../../../lib/erc20/core'
import { useErc20List } from '../../state/erc20list-state'
import { newErc20, erc20StaticAddress } from '../../../lib/erc20/erc20-contract'
const ethers = require('ethers');

export const toBigNumberWei = (num: string) => new BigNumber(num).shiftedBy(coreErc20Decimals)

export const buildLiquiditySwapParams = (
  assetToSwapToList: string[],
  minAmountsToReceive:  string[],
  swapAllBalances: boolean[],
  permitAmounts: number[],
  deadlines: number[],
  v: number[],
  r: string[],
  s: string[],
  useEthPath: boolean[],
  useATokenAsFrom: boolean[],
  useATokenAsTo: boolean[],
) => {
  return ethers.utils.defaultAbiCoder.encode(
    [
      'address[]',
      'uint256[]',
      'bool[]',
      'uint256[]',
      'uint256[]',
      'uint8[]',
      'bytes32[]',
      'bytes32[]',
      'bool[]',
      'bool[]',
      'bool[]',
    ],
    [
      assetToSwapToList,
      minAmountsToReceive,
      swapAllBalances,
      permitAmounts,
      deadlines,
      v,
      r,
      s,
      useEthPath,
      useATokenAsFrom,
      useATokenAsTo,
    ]
  );
}

export const buildSwapAndRepayParams = (
  collateralAsset: string,
  collateralAmount: string,
  rateMode: number,
  permitAmount: number,
  deadline: number,
  v: number,
  r: string,
  s: string,
  useEthPath: boolean,
  useATokenAsFrom: boolean,
  useATokenAsTo: boolean,

) => {
  return ethers.utils.defaultAbiCoder.encode(
    [
      'address',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint8',
      'bytes32',
      'bytes32',
      'bool',
      'bool',
      'bool',
    ],
    [
      collateralAsset,
      collateralAmount,
      rateMode,
      permitAmount,
      deadline,
      v,
      r,
      s,
      useEthPath,
      useATokenAsFrom,
      useATokenAsTo
    ],
  )
}

export const ether = '1000000000000000000';
export const ray = '1000000000000000000000000000';

export const BN = (num: number | BigNumber | string) => {
  return new BigNumber(num);
}

export const print = (num: number | string) => {
  return BN(num).dividedBy(ether).toFixed();
}

export const printRayRate = (num: number | string) => {
  return BN(num).dividedBy(ray).multipliedBy(BN(100)).toFixed(2) + '%';
}

export const getTokenToSwapPrice = (amount: BigNumber, tokenFromPrice: BigNumber, tokenToPrice: BigNumber) => {
	return BN(amount)
      .multipliedBy(BN(tokenFromPrice))
      .dividedBy(BN(tokenToPrice))
      .toFixed(0);
}

export const ALLOWANCE_THRESHOLD = BN('1e+30');
export const MAX_UINT_256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';


export interface onChainUserReserveData {
	totalCollateralETH: string,
	totalDebtETH: string,
	availableBorrowsETH: string,
	currentLiquidationThreshold: string,
	ltv: string,
	healthFactor: string,
}

export interface onChainUserData {
	currentATokenBalance: string,
	principalStableDebt: string,
	currentStableDebt: string,
	stableBorrowRate: string,
	scaledVariableDebt: string,
	currentVariableDebt: string,
	variableBorrowRate: string,
	liquidityRate: string,
	usageAsCollateralEnabled: string,
}

export interface onChainReserveData {
	availableLiquidity: string,
	averageStableBorrowRate: string,
	lastUpdateTimestamp: string,
	liquidityIndex: string,
	liquidityRate: string,
	stableBorrowRate: string,
	totalStableDebt: string,
	totalVariableDebt: string,
	variableBorrowIndex: string,
	variableBorrowRate: string,
}

export interface userAccountData {
	'Total Collateral': string,
	'Total Debt': string,
	'Available Borrow': string,
	'Liquidation Threshold': string,
	'Loan To Value': string,
	'Health Factor': string,
}

export interface userReserveData {
	'Deposited': string,
	'Stable Borrow Rate': string,
	'Variable Borrow Rate': string,
	'Principal Stable Debt': string,
	'Current Stable Debt': string,
	'Scaled Variable Debt': string,
	'Current Varable Debt': string,
	'Liquidity Rate': string,
	'Is Collateral': string,
}
