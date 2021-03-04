import { app, jestSetup } from '../../../../lib/spectron-utils/setup'
import { confirmTXs, installOptionalApp, selectApp } from '../../../../lib/spectron-utils/app-helpers'

jestSetup()

test('create MultiSig account', async (done) => {
	await selectApp("accounts")
	const createMultiSig = await app.client.$("button=Create MultiSig Account")
	await createMultiSig.waitForEnabled()
	await createMultiSig.click()

	const confirmCreate = await app.client.$("button=Create")
	await confirmCreate.waitForEnabled()
	await confirmCreate.click()

	// Deploy contracts && Initialize, total of 4 transactions.
	await confirmTXs({txCount: 4, skipWaitForRefetch: true})
	done()
})

test('MultiSig app', async (done) => {
	await installOptionalApp("multisig")
	// TODO(zviad): test actual trading.

	done()
})
