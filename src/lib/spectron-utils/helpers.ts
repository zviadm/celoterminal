import { SpectronClient } from "spectron"
import { increaseTime, Provider } from "celo-devchain"

import { SpectronAccountsDBPassword } from "./constants"
import { app, devchainKit } from "./setup"

let _requirePW = true
export const confirmTXs = async(client: SpectronClient, opts?: {
	requirePW?: boolean,
	txCount?: number,
}): Promise<void> => {
	_requirePW = opts?.requirePW !== undefined ? opts?.requirePW : _requirePW
	if (_requirePW) {
		const passwordInput = await client.$("#password-input")
		await passwordInput.waitForEnabled()
		await passwordInput.keys([...SpectronAccountsDBPassword, 'Enter'])
	}
	const txConfirm = await client.$("#tx-confirm")
	const txCount = opts?.txCount || 1
	for (let idx = 0; idx < txCount; idx += 1) {
		await txConfirm.waitForEnabled()
		_requirePW = false
		await txConfirm.click()
	}

	const txRunnerModal = await client.$("#tx-runner-modal")
	await txRunnerModal.waitForExist({
		reverse: true,
		timeout: 8000,
		interval: 500,
	})
	await checkErrorSnack(client)
	return
}

export const checkErrorSnack = async (client: SpectronClient): Promise<void> => {
	const errorSnack = await client.$("#error-snack")
	const errorExists = await errorSnack.isExisting()
	if (errorExists) {
		const text = await errorSnack.getText()
		throw new Error(`Error Snack active: ${text}`)
	}
	return
}

export const adjustNow = async (increaseMS: number): Promise<void> => {
	const kit = devchainKit()
	app.webContents.send("adjust-time", increaseMS)
	await increaseTime(kit.web3.currentProvider as Provider, increaseMS / 1000)
}