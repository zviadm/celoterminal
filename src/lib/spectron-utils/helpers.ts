import { increaseTime, Provider } from "celo-devchain"

import { SpectronAccountsDBPassword } from "./constants"
import { app, devchainKit } from "./setup"

let _requirePW = true
// Runs through transaction confirmation UI flow. Will check for
// an error at the end if transaction fails unexpectedly.
export const confirmTXs = async(opts?: {
	requirePW?: boolean,
	txCount?: number,
}): Promise<void> => {
	_requirePW = opts?.requirePW !== undefined ? opts?.requirePW : _requirePW
	if (_requirePW) {
		const passwordInput = await app.client.$("#password-input")
		await passwordInput.waitForEnabled()
		await passwordInput.keys([...SpectronAccountsDBPassword, 'Enter'])
	}
	const txConfirm = await app.client.$("#tx-confirm")
	const txCount = opts?.txCount || 1
	for (let idx = 0; idx < txCount; idx += 1) {
		await txConfirm.waitForEnabled({timeout: 8000})
		_requirePW = false
		await txConfirm.click()
	}

	const txRunnerModal = await app.client.$("#tx-runner-modal")
	await txRunnerModal.waitForExist({
		reverse: true,
		timeout: 8000,
		interval: 500,
	})
	await checkErrorSnack()
	return
}

// Checks and throws if ErrorSnack is activated.
export const checkErrorSnack = async (): Promise<void> => {
	const errorSnack = await app.client.$("#error-snack")
	const errorExists = await errorSnack.isExisting()
	if (errorExists) {
		const text = await errorSnack.getText()
		throw new Error(`Error Snack active: ${text}`)
	}
	return
}

export const installOptionalApp = async (appId: string): Promise<void> => {
	const menuAppstore = await app.client.$("#menu-appstore")
	await menuAppstore.waitForEnabled()
	await menuAppstore.click()

	const installApp = await app.client.$(`#install-app-${appId}`)
	await installApp.waitForEnabled()
	await installApp.click()
}

// Alters current time both for celo-devchain, and for the Celo Terminal app.
export const adjustNow = async (increaseMS: number): Promise<void> => {
	const kit = devchainKit()
	app.webContents.send("adjust-time", increaseMS)
	await increaseTime(kit.web3.currentProvider as Provider, increaseMS / 1000)
}