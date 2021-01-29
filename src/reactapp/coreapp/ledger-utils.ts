
export const expressLedgerErr = (e: Error): Error => {
	if (e.message.includes("NoDevice") ||
		e.message.includes("Ledger device: UNKNOWN")) {
		return new Error(
			`Ledger device: Can not connect. Make sure your Ledger device is ` +
			`connected, unlocked, and Celo app is launched.`)
	}
	return e
}