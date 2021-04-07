import { Token, ContractKit, StableToken } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import { ConversionFunc, RegisteredErc20 } from "../core"

export const convertMToken: ConversionFunc = async (
	kit: ContractKit, erc20: RegisteredErc20, amount: BigNumber) => {
	switch (erc20.symbol) {
	case "mCELO":
		return {coreErc20: Token.CELO, amount: amount}
	case "mCUSD":
		return {coreErc20: StableToken.cUSD, amount: amount}
	default:
		throw new Error(`Unexpected token: ${erc20.symbol}`)
	}
}
