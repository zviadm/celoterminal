import { app, devchainKit, jestSetup } from '../../../../lib/spectron-utils/setup'
import { confirmTXs, selectApp, waitForRefetch } from '../../../../lib/spectron-utils/app-helpers'

jestSetup()

test('select app', async (done) => {
	await selectApp("portfolio")
	done()
})
