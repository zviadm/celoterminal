import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

export type CoreERC20 = "CELO" | "cUSD"

export type ConversionFunc = (
	kit: ContractKit, name: string, amount: BigNumber) => Promise<{coreErc20: CoreERC20, amount: BigNumber}>

export interface RegisteredERC20 {
	name: string,
	address: string,
	conversion?: ConversionFunc,
}

export const coreErc20s: RegisteredERC20[] = [
	{name: "CELO", address: ""},
	{name: "cUSD", address: ""},
]