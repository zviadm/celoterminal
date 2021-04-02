import { app, jestSetup } from '../../../../lib/spectron-utils/setup'
import { installOptionalApp, selectApp, uninstallOptionalApp } from '../../../../lib/spectron-utils/app-helpers'

jestSetup()

test('crasher app', async (done) => {
	await installOptionalApp("test-crasher")
	const errorFallback = await app.client.$("#error-boundary-fallback")
	await errorFallback.waitForExist()

	await selectApp("portfolio")
	await errorFallback.waitForExist({reverse: true})

	await uninstallOptionalApp("test-crasher")
	done()
});
