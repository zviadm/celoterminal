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

export const ether = '1000000000000000000';
export const ray = '1000000000000000000000000000';

export const BN = (num: number | BigNumber | string) => {
  return new BigNumber(num);
}

export const print = (num: number | BigNumber) => {
  return BN(num).dividedBy(ether).toFixed();
}

export const printRayRate = (num: number | BigNumber) => {
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
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000';