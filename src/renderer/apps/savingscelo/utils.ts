import BigNumber from "bignumber.js"
import { celoToSavings, savingsToCELO } from "savingscelo"

export const ubeGetAmountOut = (
	amountIn: BigNumber.Value,
	reserveIn: BigNumber,
	reserveOut: BigNumber): BigNumber => {
	const amountWithFee = new BigNumber(amountIn).multipliedBy(0.997)
	return amountWithFee
		.multipliedBy(reserveOut)
		.div(reserveIn.plus(amountWithFee))
		.integerValue(BigNumber.ROUND_DOWN)
}

export const celoToSavingsWithMax = (
	celoAmount: BigNumber,
	sCELOAmountMax: BigNumber,
	savingsTotal_CELO: BigNumber,
	savingsTotal_sCELO: BigNumber,
): BigNumber => {
	const isMax = savingsToCELO(sCELOAmountMax, savingsTotal_sCELO, savingsTotal_CELO).eq(celoAmount)
	return isMax ? sCELOAmountMax : celoToSavings(celoAmount, savingsTotal_CELO, savingsTotal_sCELO)
}
