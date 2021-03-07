import { CeloTokenType, ContractKit, StableToken, Token } from "@celo/contractkit"
import BigNumber from "bignumber.js"

export const coreErc20Decimals = 18
export const coreErc20s: {
	name: string,
	symbol: CeloTokenType,
	decimals: number,
}[] = [
	{
		name: "Celo Native Asset",
		symbol: Token.CELO,
		decimals: coreErc20Decimals,
	}, {
		name: "Celo Dollar",
		symbol: StableToken.cUSD,
		decimals: coreErc20Decimals,
	}, {
		name: "Celo Euro",
		symbol: StableToken.cEUR,
		decimals: coreErc20Decimals,
	}
]
export const coreStableTokens = coreErc20s.filter((e) => e.symbol !== "CELO")

export type ConversionFunc = (
	kit: ContractKit, symbol: string, amount: BigNumber) => Promise<{coreErc20: CeloTokenType, amount: BigNumber}>

export interface RegisteredErc20 {
	name: string,
	symbol: string,
	decimals: number,
	address?: string, // address isn't set for core Celo tokens.

	// Conversion functions can be defined to provide conversion between
	// an ERC20 token and any of the core Celo tokens.
	conversion?: ConversionFunc,
}
