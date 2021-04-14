import BigNumber from "bignumber.js"

export const ubeGetAmountOut = (
	amountIn: BigNumber.Value,
	reserveIn: BigNumber,
	reserveOut: BigNumber): BigNumber => {
	const amountWithFee = new BigNumber(amountIn).multipliedBy(0.997)
	return amountWithFee.multipliedBy(reserveOut).div(reserveIn.plus(amountWithFee)).integerValue()
}
