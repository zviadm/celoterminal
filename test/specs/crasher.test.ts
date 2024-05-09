import { $ } from '@wdio/globals'
import { installOptionalApp, selectApp, uninstallOptionalApp } from '../app-helpers'

it('crasher app', async () => {
	await installOptionalApp("test-crasher")
	const errorFallback = await $("#error-boundary-fallback")
	await errorFallback.waitForDisplayed()

	await selectApp("portfolio")
	await expect(errorFallback.isExisting()).resolves.toEqual(false)

	await uninstallOptionalApp("test-crasher")
})