import BigNumber from "bignumber.js";
import { coreErc20Decimals } from "../../../lib/erc20/core";
import ethers from "ethers";
import { mainnetChainId, alfajoresChainId } from "../../../lib/cfg";

export const toBigNumberWei = (num: string): BigNumber =>
	new BigNumber(num).shiftedBy(coreErc20Decimals);
export const MOOLA_AVAILABLE_CHAIN_IDS = [mainnetChainId, alfajoresChainId];

export const defaultUserAccountData: userAccountData = {
	"Total Collateral": "0",
	"Total Debt": "0",
	"Available Borrow": "0",
	"Liquidation Threshold": "0",
	"Loan To Value": "0",
	"Health Factor": "0",
};

export const defaultUserReserveData: userReserveData = {
	Deposited: "0",
	"Stable Borrow Rate": "0",
	"Variable Borrow Rate": "0",
	"Principal Stable Debt": "0",
	"Current Stable Debt": "0",
	"Scaled Variable Debt": "0",
	"Current Variable Debt": "0",
	"Liquidity Rate": "0",
	"Is Collateral": "N.A",
};

export const defaultReserveData: reserveData = {
	"Available Liquidity": "0",
	"Total Stable Borrows": "0",
	"Total Variable Borrows": "0",
	"Liquidity Rate": "0",
	"Variable Borrow Rate": "0",
	"Stable Borrow Rate": "0",
	"Average Stable Rate": "0",
};

export const buildLiquiditySwapParams = (
	assetToSwapToList: string[],
	minAmountsToReceive: string[],
	swapAllBalances: number[],
	permitAmounts: number[],
	deadlines: number[],
	v: number[],
	r: string[],
	s: string[],
	useEthPath: boolean[],
	useATokenAsFrom: boolean[],
	useATokenAsTo: boolean[]
): string => {
	return ethers.utils.defaultAbiCoder.encode(
		[
			"address[]",
			"uint256[]",
			"bool[]",
			"uint256[]",
			"uint256[]",
			"uint8[]",
			"bytes32[]",
			"bytes32[]",
			"bool[]",
			"bool[]",
			"bool[]",
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
};

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
	useATokenAsTo: boolean
): string => {
	return ethers.utils.defaultAbiCoder.encode(
		[
			"address",
			"uint256",
			"uint256",
			"uint256",
			"uint256",
			"uint8",
			"bytes32",
			"bytes32",
			"bool",
			"bool",
			"bool",
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
			useATokenAsTo,
		]
	);
};

export const ETHER = "1000000000000000000";
export const RAY = "1000000000000000000000000000";

export const BN = (num: number | BigNumber | string) => {
	return new BigNumber(num);
};

export const print = (num: number | string) => {
	return BN(num).dividedBy(ETHER).toFixed();
};

export const printRayRate = (num: number | string) => {
	return BN(num).dividedBy(RAY).multipliedBy(BN(100)).toFixed(2) + "%";
};

export const getTokenToSwapPrice = (
	amount: BigNumber,
	tokenFromPrice: BigNumber,
	tokenToPrice: BigNumber
): string => {
	return BN(amount)
		.multipliedBy(BN(tokenFromPrice))
		.dividedBy(BN(tokenToPrice))
		.toFixed(0);
};

export const ALLOWANCE_THRESHOLD = BN("1e+30");
export const MAX_UINT_256 =
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const ZERO_HASH =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

export interface onChainUserReserveData {
	totalCollateralETH: string;
	totalDebtETH: string;
	availableBorrowsETH: string;
	currentLiquidationThreshold: string;
	ltv: string;
	healthFactor: string;
}

export interface onChainUserData {
	currentATokenBalance: string;
	principalStableDebt: string;
	currentStableDebt: string;
	stableBorrowRate: string;
	scaledVariableDebt: string;
	currentVariableDebt: string;
	variableBorrowRate: string;
	liquidityRate: string;
	usageAsCollateralEnabled: string;
}

export interface onChainReserveData {
	availableLiquidity: string;
	averageStableBorrowRate: string;
	lastUpdateTimestamp: string;
	liquidityIndex: string;
	liquidityRate: string;
	stableBorrowRate: string;
	totalStableDebt: string;
	totalVariableDebt: string;
	variableBorrowIndex: string;
	variableBorrowRate: string;
}

export interface userAccountData {
	"Total Collateral": string;
	"Total Debt": string;
	"Available Borrow": string;
	"Liquidation Threshold": string;
	"Loan To Value": string;
	"Health Factor": string;
}

export interface userReserveData {
	Deposited: string;
	"Stable Borrow Rate": string;
	"Variable Borrow Rate": string;
	"Principal Stable Debt": string;
	"Current Stable Debt": string;
	"Scaled Variable Debt": string;
	"Current Variable Debt": string;
	"Liquidity Rate": string;
	"Is Collateral": string;
}

export interface reserveData {
	"Available Liquidity": string;
	"Total Stable Borrows": string;
	"Total Variable Borrows": string;
	"Liquidity Rate": string;
	"Variable Borrow Rate": string;
	"Stable Borrow Rate": string;
	"Average Stable Rate": string;
}

export interface moolaToken {
	readonly name: string;
	readonly symbol: string;
	readonly decimals: number;
	readonly addresses: {
		mainnet: string;
		baklava?: string;
		alfajores: string;
	};
}

export const lendingPoolDataProviderAddresses = {
	mainnet: "0x43d067ed784D9DD2ffEda73775e2CC4c560103A1",
	alfajores: "0x31ccB9dC068058672D96E92BAf96B1607855822E",
};

export const lendingPoolAddressesProviderAddresses = {
	mainnet: "0xD1088091A174d33412a968Fa34Cb67131188B332",
	alfajores: "0xb3072f5F0d5e8B9036aEC29F37baB70E86EA0018",
};
export const autoRepayAddresses = {
	mainnet: "0xeb1549caebf24dd83e1b5e48abedd81be240e408",
	alfajores: "0x19F8322CaC86623432e9142a349504DE6754f12A",
};

export const liquiditySwapAdapterAddresses = {
	mainnet: "0x574f683a3983AF2C386cc073E93efAE7fE2B9eb3",
	alfajores: "0xe469484419AD6730BeD187c22a47ca38B054B09f",
};

export const ubeswapAddresses = {
	mainnet: "0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121",
	alfajores: "0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121",
};

export const repayAdapterAddresses = {
	mainnet: "0x18A7119360d078c5B55d8a8288bFcc43EbfeF57c",
	alfajores: "0x55a48631e4ED42D2b12FBA0edc7ad8F66c28375C",
};
