import { increaseTime, Provider } from "celo-devchain"

import { SpectronAccountsDBPassword } from "./constants"
import { app, devchainKit } from "./setup"

let _adjustedNowMS = 0
let _pwEnteredMS = 0
const pwCacheMS = 60 * 60 * 1000
// Runs through transaction confirmation UI flow. Will check for
// an error at the end if transaction fails unexpectedly.
export const confirmTXs = async(opts?: {
	txCount?: number,
	skipWaitForRefetch?: boolean,
}): Promise<void> => {
	if (Date.now() + _adjustedNowMS > _pwEnteredMS + pwCacheMS) {
		const passwordInput = await app.client.$("#password-input")
		await passwordInput.waitForEnabled()
		await passwordInput.keys([...SpectronAccountsDBPassword, 'Enter'])
	}
	const confirmTX = await app.client.$("#confirm-tx")
	const txCount = opts?.txCount || 1
	for (let idx = 0; idx < txCount; idx += 1) {
		await confirmTX.waitForEnabled({timeout: 8000})
		_pwEnteredMS = Date.now() + _adjustedNowMS
		await confirmTX.click()
	}

	const txRunnerModal = await app.client.$("#tx-runner-modal")
	await txRunnerModal.waitForExist({
		reverse: true,
		timeout: 8000,
		interval: 500,
	})
	if (!opts?.skipWaitForRefetch) {
		await waitForRefetch()
	} else {
		await checkErrorSnack()
	}
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

// Clicks `refetch` button and waits for refetch to complete.
export const refetchAppData = async (): Promise<void> => {
	const refetchData = await app.client.$("#refetch-data")
	await refetchData.click()
	await refetchData.waitForEnabled()
	await checkErrorSnack()
}

// Waits for `refetch` to complete.
export const waitForRefetch = async (): Promise<void> => {
	const refetchData = await app.client.$("#refetch-data")
	await refetchData.waitForEnabled()
	await checkErrorSnack()
}

// Installs optional app from the AppStore.
export const installOptionalApp = async (appId: string): Promise<void> => {
	const menuAppstore = await app.client.$("#menu-appstore")
	await menuAppstore.waitForEnabled()
	await menuAppstore.click()

	const installApp = await app.client.$(`#install-app-${appId}`)
	await installApp.waitForEnabled()
	await installApp.click()
}

// Uninstalls optional app.
export const uninstallOptionalApp = async (appId: string): Promise<void> => {
	const uninstallApp = await app.client.$(`#uninstall-app-${appId}`)
	await uninstallApp.waitForEnabled()
	await uninstallApp.click()

	const confirmUninstall = await app.client.$("#confirm-uninstall")
	await confirmUninstall.waitForEnabled()
	await confirmUninstall.click()
}

export const selectApp = async (appId: string): Promise<void> => {
	const menuItem = await app.client.$(`#menu-${appId}`)
	await menuItem.waitForEnabled()
	await menuItem.click()
}

export const selectAccount = async (accountIdx: number): Promise<void> => {
	const accountsSelect = await app.client.$(`#accounts-select`)
	await accountsSelect.waitForEnabled()
	await accountsSelect.click()

	const accountItem = await app.client.$(`#select-account-${accountIdx}-item`)
	await accountItem.waitForEnabled()
	await accountItem.click()
}

// Alters current time both for celo-devchain, and for the Celo Terminal app.
export const adjustNow = async (increaseMS: number): Promise<void> => {
	const kit = devchainKit()
	_adjustedNowMS += increaseMS
	app.webContents.send("adjust-time", increaseMS)
	await increaseTime(kit.web3.currentProvider as Provider, increaseMS / 1000)
}
