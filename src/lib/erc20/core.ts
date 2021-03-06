import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

export type CoreErc20 = "CELO" | "cUSD" | "cEUR"

export const coreErc20Decimals = 18
export const coreErc20s: {name: string, symbol: CoreErc20, decimals: number}[] = [
	{
		name: "Celo Native Asset",
		symbol: "CELO",
		decimals: coreErc20Decimals,
	}, {
		name: "Celo Dollar",
		symbol: "cUSD",
		decimals: coreErc20Decimals,
	}, {
		name: "Celo Euro",
		symbol: "cEUR",
		decimals: coreErc20Decimals,
	}
]
export const stableTokenSuffix = (stableTokenSymbol: CoreErc20): string => {
	return stableTokenSymbol === "cUSD" ? "" : stableTokenSymbol.slice(1)
}

export type ConversionFunc = (
	kit: ContractKit, symbol: string, amount: BigNumber) => Promise<{coreErc20: CoreErc20, amount: BigNumber}>

export interface RegisteredErc20 {
	name: string,
	symbol: string,
	decimals: number,
	address?: string, // address isn't set for core Celo tokens.

	// Conversion functions can be defined to provide conversion between
	// an ERC20 token and any of the core Celo tokens.
	conversion?: ConversionFunc,
}
