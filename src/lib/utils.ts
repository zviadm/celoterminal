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

export const fmtAmount = (
	v: BigNumber,
	decimals: "CELO" | "cUSD" | number,
	precision?: number | "max"): string => {
	if (decimals === "CELO" ||
		decimals === "cUSD") {
		decimals = 18
	}
	const fmtV = v.shiftedBy(-decimals)
	if (precision === "max") {
		return fmtV.toFixed()
	} else {
		return fmtV.toFixed((precision !== undefined ? precision : 2))
	}
}

export const fmtAddress = (address: string): string => {
	return `${address.slice(0, 6)}...${address.slice(address.length-4)}`
}