import { browser, $ } from '@wdio/globals'
import { increaseTime, Provider } from "@celo/celo-devchain"

import { devchainKit } from "./setup"
import { E2ETestAccountsDBPassword } from "../src/lib/e2e-constants"

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
		const passwordInput = await $("#password-input")
		await passwordInput.waitForClickable()
		await passwordInput.click()
		await browser.keys([...E2ETestAccountsDBPassword, 'Enter'])
	}
	const confirmTX = await $("#confirm-tx")
	const txCount = opts?.txCount || 1
	for (let idx = 0; idx < txCount; idx += 1) {
		await confirmTX.waitForClickable({timeout: 8000})
		_pwEnteredMS = Date.now() + _adjustedNowMS
		await confirmTX.click()
	}

	const txRunnerModal = await $("#tx-runner-modal")
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
export const checkErrorSnack = async (expectErrMsg?: string): Promise<void> => {
	const errorSnack = await $("#error-snack")
	if (!expectErrMsg) {
		const errorExists = await errorSnack.isExisting()
		if (errorExists) {
			const text = await errorSnack.getText()
			throw new Error(`Error Snack active: '${text}'`)
		}
	} else {
		await errorSnack.waitForExist({timeout: 2000})
		const text = await errorSnack.getText()
		if (!text.includes(expectErrMsg)) {
			throw new Error(`Error Snack: '${expectErrMsg}' not found in '${text}'!`)
		}
	}
	return
}

// Clicks `refetch` button and waits for refetch to complete.
export const refetchAppData = async (): Promise<void> => {
	const refetchData = await $("#refetch-data")
	await refetchData.click()
	await refetchData.waitForClickable()
	await checkErrorSnack()
}

// Waits for `refetch` to complete.
export const waitForRefetch = async (): Promise<void> => {
	const refetchData = await $("#refetch-data")
	await refetchData.waitForClickable()
	await checkErrorSnack()
}

// Installs optional app from the AppStore.
export const installOptionalApp = async (appId: string): Promise<void> => {
	const menuAppstore = await $("#menu-appstore")
	await menuAppstore.waitForClickable()
	await menuAppstore.click()

	const installApp = await $(`#install-app-${appId}`)
	await installApp.waitForClickable()
	await installApp.click()
}

// Uninstalls optional app.
export const uninstallOptionalApp = async (appId: string): Promise<void> => {
	const uninstallApp = await $(`#uninstall-app-${appId}`)
	await uninstallApp.waitForClickable()
	await uninstallApp.click()

	const confirmUninstall = await $("#confirm-uninstall")
	await confirmUninstall.waitForClickable()
	await confirmUninstall.click()
}

export const selectApp = async (appId: string): Promise<void> => {
	const menuItem = await $(`#menu-${appId}`)
	await menuItem.waitForClickable()
	await menuItem.click()
}

export const selectAccount = async (accountIdx: number): Promise<void> => {
	const accountsSelect = await $(`#accounts-select`)
	await accountsSelect.waitForClickable()
	await accountsSelect.click()

	const accountItem = await $(`#select-account-${accountIdx}-item`)
	await accountItem.waitForClickable()
	await accountItem.click()
}

// Alters current time both for celo-devchain, and for the Celo Terminal app.
export const adjustNow = async (increaseMS: number): Promise<void> => {
	const kit = devchainKit()
	_adjustedNowMS += increaseMS;
	const adjustTimeOpen = await $(`#adjust-time-open`)
	await adjustTimeOpen.click()
	const adjustTimeMSInput= await $(`#adjust-time-ms-input`)
	await adjustTimeMSInput.waitForClickable()
	await adjustTimeMSInput.doubleClick()
	await browser.keys([..._adjustedNowMS.toString(), "Escape"])

	await increaseTime(kit.web3.currentProvider as Provider, increaseMS / 1000)
}
