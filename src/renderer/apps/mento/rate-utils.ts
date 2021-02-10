import BigNumber from 'bignumber.js'

import { Decimals } from './config'

export const calcCeloAmount = (
	side: "sell" | "buy",
	stableAmount: BigNumber,
	celoBucket: BigNumber,
	stableBucket: BigNumber,
	spread: BigNumber): BigNumber => {
	return side === "sell" ?
		calcSellAmount(stableAmount, stableBucket, celoBucket, spread) :
		calcBuyAmount(stableAmount, stableBucket, celoBucket, spread)
}

export const calcStableAmount = (
	side: "sell" | "buy",
	celoAmount: BigNumber,
	celoBucket: BigNumber,
	stableBucket: BigNumber,
	spread: BigNumber): BigNumber => {
	return side === "sell" ?
		calcBuyAmount(celoAmount, celoBucket, stableBucket, spread) :
		calcSellAmount(celoAmount, celoBucket, stableBucket, spread)
}

const calcBuyAmount = (
	sellAmount: BigNumber,
	sellBucket: BigNumber,
	buyBucket: BigNumber,
	spread: BigNumber) => {
	// _getBuyTokenAmount from exchange.sol
	const reducedSellAmt = sellAmount.multipliedBy(new BigNumber(1).minus(spread))
	return reducedSellAmt.multipliedBy(buyBucket)
		.div(sellBucket.plus(reducedSellAmt))
}

const calcSellAmount = (
	buyAmount: BigNumber,
	buyBucket: BigNumber,
	sellBucket: BigNumber,
	spread: BigNumber) => {
	// _getSellTokenAmount from exchange.sol
	return buyAmount.multipliedBy(sellBucket)
		.div(buyBucket.minus(buyAmount).multipliedBy(new BigNumber(1).minus(spread)))
}

export const fmtTradeAmount = (
	n: BigNumber,
	roundingMode: BigNumber.RoundingMode): string => {
	if (!n.gt(0)) {
		return ""
	} else {
		const v = n.shiftedBy(-Decimals)
		const maxDP = 6
		let dp = maxDP
		for (; dp > 0; dp--) {
			if (v.gte(10 ** (dp - 1))) {
				break
			}
		}
		return v.decimalPlaces(maxDP - dp, roundingMode).toString()
	}
}