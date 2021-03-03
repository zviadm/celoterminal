import BigNumber from "bignumber.js"
import { fmtAmount } from "./utils"

test('check fmtAmount edge cases', () => {
	expect(
		fmtAmount(new BigNumber(1.126e18), "CELO")).toEqual("1.12")
	expect(
		fmtAmount(new BigNumber(1.123e18), "CELO", 6)).toEqual("1.123000")
	expect(
		fmtAmount(new BigNumber(0.123e18), "CELO", 2)).toEqual("0.12")
	expect(
		fmtAmount(new BigNumber(0.00123e18), "CELO")).toEqual("0.0012")
	expect(
		fmtAmount(new BigNumber(1000.1e18), "CELO")).toEqual("1,000.10")
	expect(
		fmtAmount(new BigNumber(1100e18), "CELO")).toEqual("1,100.00")
})