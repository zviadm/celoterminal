import { Token, ContractKit, StableToken } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import { ConversionFunc } from "../core"

export const convertMToken: ConversionFunc = async (
	kit: ContractKit, symbol: string, amount: BigNumber) => {
	switch (symbol) {
	case "mCELO":
		return {coreErc20: Token.CELO, amount: amount}
	case "mCUSD":
		return {coreErc20: StableToken.cUSD, amount: amount}
	default:
		throw new Error(`Unexpected token: ${symbol}`)
	}
}
