import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import { ConversionFunc } from "../core"

export const convertMToken: ConversionFunc = async (
	kit: ContractKit, name: string, amount: BigNumber) => {
	switch (name) {
	case "Moola:mCELO":
		return {coreErc20: "CELO", amount: amount}
	case "Moola:mCUSD":
		return {coreErc20: "cUSD", amount: amount}
	default:
		throw new Error(`Unexpected token: ${name}`)
	}
}
