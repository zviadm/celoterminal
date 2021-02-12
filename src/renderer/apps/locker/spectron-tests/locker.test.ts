import { app, jestSetup } from '../../../../lib/spectron-utils/setup'
import { confirmTXs } from '../../../../lib/spectron-utils/tx-runner'

jestSetup()

test('Create account', async (done) => {
	const menuLocker = await app.client.$("#menu-locker")
	await menuLocker.waitForExist()
	await menuLocker.click()

	const createAccount = await app.client.$("#create-account")
	await createAccount.waitForExist()
	await createAccount.click()

	await confirmTXs(app.client)
	done()
});
