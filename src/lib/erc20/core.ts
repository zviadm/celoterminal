import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

export type CoreERC20 = "CELO" | "cUSD"

export const coreErc20s = ["CELO", "cUSD"]

export type ConversionFunc = (
	kit: ContractKit, name: string, amount: BigNumber) => Promise<{coreErc20: CoreERC20, amount: BigNumber}>

export interface RegisteredERC20 {
	fullName: string, // Format: <DApp>:<Token>, ex: 'Moola:mCUSD'.
	address: string,
	conversion?: ConversionFunc,
}
