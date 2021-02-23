import BigNumber from 'bignumber.js'

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
	v: BigNumber,
	decimals: "CELO" | "cUSD" | number,
	precision?: number | "max"): string => {
	if (decimals === "CELO" ||
		decimals === "cUSD") {
		decimals = 18
	}
	let fmtV = v.shiftedBy(-decimals)
	if (precision !== "max") {
		const dp = (precision !== undefined ? precision : _precisionDefault)
		let fmtVRounded = fmtV.decimalPlaces(dp, BigNumber.ROUND_DOWN)
		if (fmtVRounded.eq(0)) {
			fmtVRounded = fmtV.decimalPlaces(_precisionForZero)
		}
		fmtV = fmtVRounded
	}
	return fmtV.toFixed()
}

export const fmtAddress = (address: string): string => {
	return `${address.slice(0, 6)}...${address.slice(address.length-4)}`
}