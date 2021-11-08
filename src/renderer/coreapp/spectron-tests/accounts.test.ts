import { app, jestSetup } from '../../../lib/spectron-utils/setup'
import { checkErrorSnack, selectAccount, selectApp } from '../../../lib/spectron-utils/app-helpers'
import { SpectronAccounts } from '../../../lib/spectron-utils/constants'

jestSetup()

test('create read-only account', async (done) => {
	await selectApp("accounts")
	const addAccount = await app.client.$("button=Add Account")
	await addAccount.waitForEnabled()
	await addAccount.click()
	const addROAccount = await app.client.$("button=Add ReadOnly Account")
	await addROAccount.waitForEnabled()
	await addROAccount.click()

	const nameInput = await app.client.$("#name-input")
	await nameInput.keys("test-read-only")
	const addressInput = await app.client.$("#address-input")
	await addressInput.keys(SpectronAccounts[3])

	const confirmCreate = await app.client.$("button=Add")
	await confirmCreate.waitForEnabled()
	await confirmCreate.click()

	await selectAccount(3)

	await selectApp("locker")
	const createAccount = await app.client.$("#create-account")
	await createAccount.waitForEnabled()
	await createAccount.click()
	await checkErrorSnack("can not sign transactions")

	done()
})
