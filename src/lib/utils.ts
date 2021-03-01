import BigNumber from 'bignumber.js'
import { CoreErc20, coreErc20Decimals } from './erc20/core'

export const sleep = (milliseconds: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export class CancelPromise {
	private cancelled = false
	private p
	private resolve?: (value: void | PromiseLike<void>) => void
	constructor() {
		this.p = new Promise<void>((resolve) => {
			this.resolve = resolve
		})
	}

	cancel = (): void => {
		this.resolve && this.resolve()
		this.cancelled = true
	}

	isCancelled = (): boolean => {
		return this.cancelled
	}

	cancelPromise = (): Promise<void> => {
		return this.p
	}
}

const _precisionDefault = 2
const _precisionForZero = 4

export const fmtAmount = (
	v: BigNumber.Value,
	decimals: CoreErc20 | number,
	precision?: number | "max"): string => {
	if (typeof decimals === "string") {
		decimals = coreErc20Decimals
	}
	let fmtV = new BigNumber(v).shiftedBy(-decimals)
	if (precision !== "max") {
		const dp = (precision !== undefined ? precision : _precisionDefault)
		let fmtVRounded = fmtV.decimalPlaces(dp, BigNumber.ROUND_DOWN)
		if (fmtVRounded.eq(0)) {
			fmtVRounded = fmtV.decimalPlaces(_precisionForZero)
		}
		fmtV = fmtVRounded
	}
	return fmtV.toNumber().toLocaleString(undefined, {maximumFractionDigits: 18})
}

export const fmtAddress = (address: string): string => {
	return `${address.slice(0, 6)}...${address.slice(address.length-4)}`
}