import BigNumber from 'bignumber.js'

export const fmtTradeAmount = (
	n: BigNumber,
	decimals: number,
	roundingMode?: BigNumber.RoundingMode): string => {
	if (!n.gt(0)) {
		return "0.0"
	} else {
		const v = n.shiftedBy(-decimals)
		const maxDP = 6
		let dp = maxDP
		for (; dp > 0; dp--) {
			if (v.gte(10 ** (dp - 1))) {
				break
			}
		}
		return v.decimalPlaces(maxDP - dp, roundingMode || BigNumber.ROUND_DOWN).toString()
	}
}
