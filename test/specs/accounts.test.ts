import { browser, $ } from '@wdio/globals'
import { checkErrorSnack, selectAccount, selectApp } from '..//app-helpers'
import { E2ETestAccounts } from '../../src/lib/e2e-constants'

it('create read-only account', async () => {
	await selectApp("accounts")
	const addAccount = await $("button=Add Account")
	await addAccount.waitForEnabled()
	await addAccount.click()
	const addROAccount = await $("button=Add ReadOnly Account")
	await addROAccount.waitForEnabled()
	await addROAccount.click()

	const nameInput = await $("#name-input")
	await nameInput.click()
	await browser.keys("test-read-only")
	const addressInput = await $("#address-input")
	await addressInput.click()
	await browser.keys(E2ETestAccounts[3])

	const confirmCreate = await $("button=Add")
	await confirmCreate.waitForEnabled()
	await confirmCreate.click()

	await selectAccount(3)

	await selectApp("locker")
	const createAccount = await $("#create-account")
	await createAccount.waitForEnabled()
	await createAccount.click()
	await checkErrorSnack("can not sign transactions")
})
