import { SpectronClient } from "spectron"

import { SpectronAccountsDBPassword } from "./constants"

let _enteredPW = false
export const confirmTXs = async(client: SpectronClient, opts?: {
	enteredPW?: boolean,
	txCount?: number,
}): Promise<void> => {
	if (!_enteredPW && !opts?.enteredPW) {
		const passwordInput = await client.$("#password-input")
		await passwordInput.waitForExist()
		await passwordInput.keys([...SpectronAccountsDBPassword, 'Enter'])
	}
	const txConfirm = await client.react$(
		"WithStyles(ForwardRef(Button))",
		{props: {id: "tx-confirm", disabled: false}})
  // const txConfirm = await client.$("tx-confirm")
	const txCount = opts?.txCount || 1
	for (let idx = 0; idx < txCount; idx += 1) {
		await txConfirm.waitForExist()
		_enteredPW = true
		await txConfirm.click()
	}

	const txRunnerModal = await client.$("tx-runner-modal")
	await txRunnerModal.waitForExist({reverse: true})

	await checkErrorSnack(client)
	return
}

export const checkErrorSnack = async (client: SpectronClient) => {
	const errorSnack = await client.$("error-snack")
}