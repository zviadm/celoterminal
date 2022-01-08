import { Token, ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import { SavingsKit } from "savingscelo"
import { ConversionFunc, RegisteredErc20 } from "../core"

export const convertSCELO: ConversionFunc = async (
	kit: ContractKit, erc20: RegisteredErc20, amount: BigNumber) => {
	switch (erc20.symbol) {
	case "sCELO":
	case "sCELOxDEPRECATED":
	{
		const savingsKit = new SavingsKit(kit, erc20.address || "")
		const celoAmt = await savingsKit.savingsToCELO(amount)
		return {coreErc20: Token.CELO, amount: celoAmt}
	}
	default:
		throw new Error(`Unexpected token: ${erc20.symbol}`)
	}
}
