import { Application } from 'spectron'

import { startApp, testLog } from '../../../../lib/spectron-utils/setup'
import { confirmTXs } from '../../../../lib/spectron-utils/tx-runner'

let app: Application
let cleanup: () => Promise<void>
beforeAll(async () => {
	const r = await startApp()
	app = r.app
	cleanup = r.cleanup
})
afterAll(async () => {
	return cleanup && cleanup()
})

test('Create account', async (done) => {
	const menuLocker = await app.client.$("#menu-locker")
	await menuLocker.waitForExist()
	await menuLocker.click()

	const createAccount = await app.client.$("#create-account")
	await createAccount.waitForExist()
	await createAccount.click()

	await confirmTXs(app.client)
	done()
	testLog(`Done`)
});
