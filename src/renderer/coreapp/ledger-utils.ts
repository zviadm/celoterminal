import { UserError } from "../../lib/error"

export const transformError = (e: Error): Error => {
	if (e.message.includes("NoDevice") ||
		e.message.includes("cannot open device") ||
		e.message.includes("Ledger device: UNKNOWN") ||
		e.message.includes("Ledger device: INS_NOT_SUPPORTED")) {
		return new UserError(
			`Ledger device: Can not connect. Make sure your Ledger device is ` +
			`connected, unlocked, and the Celo app is launched.`)
	}
	if (e.message.includes("Ledger device:")) {
		return new UserError(e.message)
	}
	return e
}
