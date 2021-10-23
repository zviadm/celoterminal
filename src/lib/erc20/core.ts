import { CeloTokenType, ContractKit, StableToken, Token } from "@celo/contractkit"
import BigNumber from "bignumber.js"

export const coreErc20Decimals = 18
export const coreErc20_CELO = {
		name: "Celo Native Asset",
		symbol: Token.CELO,
		decimals: coreErc20Decimals,
	}
export const coreErc20_cUSD = {
		name: "Celo Dollar",
		symbol: StableToken.cUSD,
		decimals: coreErc20Decimals,
	}
export const coreErc20_cEUR = {
		name: "Celo Euro",
		symbol: StableToken.cEUR,
		decimals: coreErc20Decimals,
	}
export const coreErc20s: {
	readonly name: string,
	readonly symbol: CeloTokenType,
	readonly decimals: number,
}[] = [
	coreErc20_CELO,
	coreErc20_cUSD,
	coreErc20_cEUR,
]
export const coreStableTokens = coreErc20s.filter((e) => e.symbol !== "CELO")

export type ConversionFunc = (
	kit: ContractKit, erc20: RegisteredErc20, amount: BigNumber) => Promise<{coreErc20: CeloTokenType, amount: BigNumber}>

export interface RegisteredErc20 {
	readonly name: string,
	readonly symbol: string,
	readonly decimals: number,
	readonly address?: string, // address isn't set for core Celo tokens.

	// Conversion functions can be defined to provide conversion between
	// an ERC20 token and any of the core Celo tokens.
	readonly conversion?: ConversionFunc,
}

export const Erc20InfiniteAmount = new BigNumber("0xff00000000000000000000000000000000000000000000000000000000000000")
export const Erc20InfiniteThreshold = new BigNumber("0xfe00000000000000000000000000000000000000000000000000000000000000")