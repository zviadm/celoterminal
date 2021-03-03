import { jestSetup } from '../../../../lib/spectron-utils/setup'
import { checkErrorSnack, selectApp, waitForRefetch } from '../../../../lib/spectron-utils/app-helpers'

jestSetup()

test('select app', async (done) => {
	await selectApp("portfolio")
	await waitForRefetch()
	await checkErrorSnack()
	done()
})
