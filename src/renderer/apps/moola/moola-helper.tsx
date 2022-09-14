import BigNumber from "bignumber.js";
import Web3 from "web3";
import { coreErc20Decimals } from "../../../lib/erc20/core";
import { mainnetChainId, alfajoresChainId } from "../../../lib/cfg";
import { moolaTokens } from "./config";
import { abi as LendingPoolDataProviderABI } from "./abi/DataProvider.json";
import { abi as UbeswapABI } from "./abi/Ubeswap.json";
import { AbiItem } from "@celo/connect";

export const toBigNumberWei = (num: string): BigNumber =>
	new BigNumber(num).shiftedBy(coreErc20Decimals);
export const MOOLA_AVAILABLE_CHAIN_IDS = [mainnetChainId, alfajoresChainId];

export const toHumanFriendlyWei = (wei: BigNumber | string): string => {
	return Number(BN(wei)).toLocaleString();
};

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

const getMoolaTokenCeloAddresses = () => {
	const coreErc20Addresses: moolaTokenCeloAddressesMap = {};
	moolaTokens.forEach((token) => {
		coreErc20Addresses[token.symbol] = token.addresses.mainnet;
	});

	return coreErc20Addresses;
};

export const getMoolaSwapPath = (
	tokenFrom: string,
	tokenTo: string
): moolaTokenSwapPath => {
	const mcusdAddress = "0x918146359264c492bd6934071c6bd31c854edbc3";
	const mceurAddress = "0xe273ad7ee11dcfaa87383ad5977ee1504ac07568";
	const mceloAddress = "0x7d00cd74ff385c955ea3d79e47bf06bd7386387d";
	const moolaTokenAddresses = getMoolaTokenCeloAddresses();
	const {
		CELO: celoAddress,
		cUSD: cusdAddress,
		MOO: mooAddress,
		cREAL: crealAddress,
		cEUR: ceurAddress,
	} = moolaTokenAddresses;

	const celo_cusd = [celoAddress, mcusdAddress]; // celo-mcusd
	const celo_ceur = [celoAddress, mceurAddress]; // celo-mceur
	const celo_creal = [celoAddress, cusdAddress, crealAddress]; // celo-cusd, cusd-creal pair
	const celo_moo = [mceloAddress, mooAddress]; // mcelo-moo

	const cusd_ceur = [mcusdAddress, mceurAddress]; // mcusd-mceur
	const cusd_creal = [cusdAddress, crealAddress]; // cusd-creal
	const cusd_moo = [cusdAddress, celoAddress, mooAddress]; // cusd-celo, celo-moo pair

	const ceur_creal = [ceurAddress, celoAddress, cusdAddress, crealAddress]; // ceur-celo, celo-cusd, cusd-creal - only 3k usd in pools
	const ceur_moo = [mceurAddress, celoAddress, mooAddress]; // mceur-celo, celo-moo

	const creal_moo = [crealAddress, cusdAddress, celoAddress, mooAddress]; // creal-cusd, cusd-celo, celo-moo

	const pathKey = `${tokenFrom}_${tokenTo}`.toLowerCase();
	switch (pathKey) {
		case `${celoAddress}_${cusdAddress}`.toLowerCase():
			return {
				path: celo_cusd,
				useATokenAsFrom: false,
				useATokenAsTo: true,
			};
		case `${celoAddress}_${ceurAddress}`.toLowerCase():
			return {
				path: celo_ceur,
				useATokenAsFrom: false,
				useATokenAsTo: true,
			};
		case `${celoAddress}_${crealAddress}`.toLowerCase():
			return {
				path: celo_creal,
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
		case `${celoAddress}_${mooAddress}`.toLowerCase():
			return {
				path: celo_moo,
				useATokenAsFrom: true,
				useATokenAsTo: false,
			};
		case `${cusdAddress}_${ceurAddress}`.toLowerCase():
			return {
				path: cusd_ceur,
				useATokenAsFrom: true,
				useATokenAsTo: true,
			};
		case `${cusdAddress}_${crealAddress}`.toLowerCase():
			return {
				path: cusd_creal,
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
		case `${cusdAddress}_${mooAddress}`.toLowerCase():
			return {
				path: cusd_moo,
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
		case `${ceurAddress}_${crealAddress}`.toLowerCase():
			return {
				path: ceur_creal,
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
		case `${ceurAddress}_${mooAddress}`.toLowerCase():
			return {
				path: ceur_moo,
				useATokenAsFrom: true,
				useATokenAsTo: false,
			};
		case `${crealAddress}_${mooAddress}`.toLowerCase():
			return {
				path: creal_moo,
				useATokenAsFrom: false,
				useATokenAsTo: true,
			};
		case `${cusdAddress}_${celoAddress}`.toLowerCase():
			return {
				path: [...celo_cusd].reverse(),
				useATokenAsFrom: true,
				useATokenAsTo: false,
			};
		case `${ceurAddress}_${celoAddress}`.toLowerCase():
			return {
				path: [...celo_ceur].reverse(),
				useATokenAsFrom: true,
				useATokenAsTo: false,
			};
		case `${crealAddress}_${celoAddress}`.toLowerCase():
			return {
				path: [...celo_creal].reverse(),
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
		case `${mooAddress}_${celoAddress}`.toLowerCase():
			return {
				path: [...celo_moo].reverse(),
				useATokenAsFrom: true,
				useATokenAsTo: false,
			};
		case `${ceurAddress}_${cusdAddress}`.toLowerCase():
			return {
				path: [...cusd_ceur].reverse(),
				useATokenAsFrom: true,
				useATokenAsTo: true,
			};
		case `${crealAddress}_${cusdAddress}`.toLowerCase():
			return {
				path: [...cusd_creal].reverse(),
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
		case `${mooAddress}_${cusdAddress}`.toLowerCase():
			return {
				path: [...cusd_moo].reverse(),
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
		case `${crealAddress}_${ceurAddress}`.toLowerCase():
			return {
				path: [...ceur_creal].reverse(),
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
		case `${mooAddress}_${ceurAddress}`.toLowerCase():
			return {
				path: [...ceur_moo].reverse(),
				useATokenAsFrom: false,
				useATokenAsTo: true,
			};
		case `${mooAddress}_${crealAddress}`.toLowerCase():
			return {
				path: [...creal_moo].reverse(),
				useATokenAsFrom: true,
				useATokenAsTo: false,
			};
		default:
			return {
				path: [
					moolaTokenAddresses[
						(tokenFrom.toUpperCase(),
						moolaTokenAddresses[tokenTo.toUpperCase()])
					],
				],
				useATokenAsFrom: false,
				useATokenAsTo: false,
			};
	}
};

export const ETHER = "1000000000000000000";
export const RAY = "1000000000000000000000000000";

export const BN = (num: number | BigNumber | string): BigNumber => {
	return new BigNumber(num);
};

export const print = (num: number | string): string => {
	return BN(num).dividedBy(ETHER).toFixed();
};

export const printRayRate = (num: number | string): string => {
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
		.multipliedBy(995)
		.dividedBy(1000) // 0.5% slippage
		.toFixed(0);
};

export const buildLeverageBorrowParams = (
	web3: Web3,
	useATokenAsFrom: boolean,
	useATokenAsTo: boolean,
	useEthPath: boolean,
	toAsset: string,
	minAmountOut: string
): string => {
	return web3.eth.abi.encodeParameter(
		"tuple(bool useATokenAsFrom, bool useATokenAsTo, bool useEthPath, address toAsset, uint256 minAmountOut)[]",
		[[useATokenAsFrom, useATokenAsTo, useEthPath, toAsset, minAmountOut]]
	);
};

const getAmountOutPromiseHandler = async (
	promise: Promise<number[]>
): Promise<BigNumber> => {
	try {
		const amounts = await promise;
		return BN(amounts[1]);
	} catch (error) {
		return BN(0);
	}
};

export const getUseMTokenFromTo = async (
	web3: Web3,
	tokenFrom: string,
	tokenTo: string,
	amount: BigNumber,
	lendingPoolDataProviderAddress: string,
	ubeswapAddress: string
): Promise<{
	tokenFrom: string;
	tokenTo: string;
	amountOut: BigNumber;
	useMTokenAsFrom: boolean;
	useMTokenAsTo: boolean;
}> => {
	const getMTokenAddress = async (token: string) => {
		const LendingPoolDataProvider = new web3.eth.Contract(
			LendingPoolDataProviderABI as AbiItem[],
			lendingPoolDataProviderAddress
		);
		return (
			await LendingPoolDataProvider.methods
				.getReserveTokensAddresses(token)
				.call()
		).aTokenAddress;
	};

	const Ubeswap = new web3.eth.Contract(
		UbeswapABI as AbiItem[],
		ubeswapAddress
	);

	const mFrom = await getMTokenAddress(tokenFrom);
	const mTo = await getMTokenAddress(tokenTo);

	const tokenCombs = [
		[tokenFrom, tokenTo],
		[tokenFrom, mTo],
		[mFrom, mTo],
		[mFrom, tokenTo],
	];

	const promises = tokenCombs.map((comb) =>
		getAmountOutPromiseHandler(
			Ubeswap.methods.getAmountsOut(amount, [comb[0], comb[1]]).call()
		)
	);

	const results = await Promise.all(promises);

	const finalResult = {
		tokenFrom: "",
		tokenTo: "",
		amountOut: BN(0),
		useMTokenAsFrom: false,
		useMTokenAsTo: false,
	};

	results.forEach((amountOut, index) => {
		if (BN(amountOut).gt(finalResult.amountOut)) {
			finalResult.tokenFrom = tokenCombs[index][0];
			finalResult.tokenTo = tokenCombs[index][1];
			finalResult.amountOut = BN(amountOut);
		}
	});

	finalResult.useMTokenAsFrom = mFrom === finalResult.tokenFrom;
	finalResult.useMTokenAsTo = mTo === finalResult.tokenTo;

	return finalResult;
};

export const ALLOWANCE_THRESHOLD = BN("1e+30");
export const MAX_UINT_256 =
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const ZERO_HASH =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

export interface moolaTokenCeloAddressesMap {
	[tokenSymbol: string]: string;
}

export interface moolaTokenSwapPath {
	path: string[];
	useATokenAsFrom: boolean;
	useATokenAsTo: boolean;
}
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
	address?: string;
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
	mainnet: "0x1C92B2eAea7c53Ac08A7B77151c2F0734b8e35b1",
	alfajores: "0xa7174954cD0B7D2Fd3237D24bD874e74c53E5796",
};

export const ubeswapAddresses = {
	mainnet: "0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121",
	alfajores: "0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121",
};

export const repayFromCollateralAdapterAddresses = {
	mainnet: "0xC96c78E46169cB854Dc793437A105F46F2435455",
	alfajores: "0x71b570D5f0Ec771A396F947E7E2870042dB9bA57",
};

export const leverageBorrowAdapterAddresses = {
	mainnet: "0x3dC0FCd3Aa6ca66a434086180e2604B9A9CFE781",
	alfajores: "0x2fc031C35bcc4625d5246D256934cE85ef86447D",
};
