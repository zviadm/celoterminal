import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

export type CoreErc20 = "CELO" | "cUSD"

export const coreErc20s = ["CELO", "cUSD"]
export const coreErc20Decimals = 18

export type ConversionFunc = (
	kit: ContractKit, name: string, amount: BigNumber) => Promise<{coreErc20: CoreErc20, amount: BigNumber}>

export interface RegisteredErc20 {
	fullName: string, // Format: <DApp/Product>:<Symbol>, ex: 'Moola:mCUSD'.
	address: string,
	decimals: number,
	// Conversion functions can be defined to provide conversion between
	// an ERC20 token and any of the core Celo tokens.
	conversion?: ConversionFunc,
}
