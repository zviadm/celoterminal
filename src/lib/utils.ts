// import { CeloTokenType } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { registeredErc20s } from './cfg'
import { coreErc20Decimals, coreErc20s, RegisteredErc20 } from './erc20/core'
import { erc20StaticAddress } from './erc20/erc20-contract'

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
const _precisionForZero = 6

export const fmtAmount = (
	v: BigNumber.Value,
	decimals: "CELO" | "cUSD" | "cEUR" | number,
	precision?: number | "max"): string => {
	if (typeof decimals === "string") {
		decimals = coreErc20Decimals
	}
	let fmtV = new BigNumber(v).shiftedBy(-decimals)
	const dp = (precision !== undefined && precision !== "max" ? precision : _precisionDefault)
	if (precision !== "max") {
		let fmtVRounded = fmtV.decimalPlaces(dp, BigNumber.ROUND_DOWN)
		if (fmtVRounded.eq(0)) {
			fmtVRounded = fmtV.decimalPlaces(_precisionForZero)
		}
		fmtV = fmtVRounded
	}
	return fmtV.toNumber().toLocaleString(undefined, {
		minimumFractionDigits: dp,
		maximumFractionDigits: 18,
	})
}

export const fmtAddress = (address: string): string => {
	return `${address.slice(0, 6)}...${address.slice(address.length-4)}`
}

export const erc20FromAddress = (address: string, extraErc20s?: RegisteredErc20[]): RegisteredErc20 | undefined => {
	let erc20: RegisteredErc20 | undefined = coreErc20s.find((r) => erc20StaticAddress(r) === address)
	if (!erc20 && extraErc20s) {
		erc20 = extraErc20s.find((r) => erc20StaticAddress(r) === address)
	}
	if (!erc20) {
		erc20 = registeredErc20s.find((r) => erc20StaticAddress(r) === address)
	}
	return erc20
}
