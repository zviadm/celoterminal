import { app, jestSetup } from '../../../../lib/spectron-utils/setup'
import { adjustNow, confirmTXs } from '../../../../lib/spectron-utils/helpers'

jestSetup()

test('Create account', async (done) => {
	const menuLocker = await app.client.$("#menu-locker")
	await menuLocker.waitForEnabled()
	await menuLocker.click()

	const createAccount = await app.client.$("#create-account")
	await createAccount.waitForEnabled()
	await createAccount.click()
	await confirmTXs(app.client)

	done()
});

test('Lock & Unlock CELO', async (done) => {
	const lockInput = await app.client.$("#lock-celo-input")
	await lockInput.waitForEnabled()
	await lockInput.click()
	await lockInput.keys(["100"])
	const lockCelo = await app.client.$("#lock-celo")
	await lockCelo.click()
	await confirmTXs(app.client)

	const unlockInput = await app.client.$("#unlock-celo-input")
	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await unlockInput.keys(["50"])
	const unlockCelo = await app.client.$("#unlock-celo")
	await unlockCelo.click()
	await confirmTXs(app.client)

	const pending0 = await app.client.$("#withdraw-0")
	await pending0.waitForExist()
	await expect(pending0.isEnabled()).resolves.toBe(false)

	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await unlockInput.keys(["25"])
	await unlockCelo.click()
	await confirmTXs(app.client)

	const pending1 = await app.client.$("#cancel-withdraw-1")
	await pending1.waitForEnabled()
	await pending1.click()
	await confirmTXs(app.client)

	await pending1.waitForExist({reverse: true})

	await adjustNow(3 * 24 * 60 * 60 * 1000) // Pass time to enable withdraws.
	const appRefetch = await app.client.$("#app-refetch")
	await appRefetch.click()
	await pending0.waitForEnabled()
	await pending0.click()
	// since 3 days have passed, we need to set `requirePW` because cached password
	// would have expired already.
	await confirmTXs(app.client, {requirePW: true})

	await pending0.waitForExist({reverse: true})
	done()
});