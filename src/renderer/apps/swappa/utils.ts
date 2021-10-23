import BigNumber from 'bignumber.js'
import { registeredErc20s } from '../../../lib/cfg'
import { coreErc20Decimals, RegisteredErc20 } from '../../../lib/erc20/core'

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
	decimals: number,
	roundingMode: BigNumber.RoundingMode): string => {
	if (!n.gt(0)) {
		return ""
	} else {
		const v = n.shiftedBy(-coreErc20Decimals)
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

export const erc20Addr = (erc20: RegisteredErc20): string => {
	if (erc20.address) {
		return erc20.address
	}
	const m = registeredErc20s.find((r) => r.address && r.symbol === erc20.symbol)
	if (!m?.address) {
		throw new Error(`Missing erc20: ${erc20.symbol}!`)
	}
	return m.address
}
