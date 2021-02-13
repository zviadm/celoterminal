import { app, devchainKit, jestSetup } from '../../../../lib/spectron-utils/setup'
import { adjustNow, confirmTXs, refetchAppData } from '../../../../lib/spectron-utils/helpers'
import { SpectronAccounts } from '../../../../lib/spectron-utils/constants';
import { createValidatorGroup } from '../../../../lib/spectron-utils/core-contract-helpers';

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
	await refetchAppData(app.client)

	await pending0.waitForEnabled()
	await pending0.click()
	// since 3 days have passed, we need to set `requirePW` because cached password
	// would have expired already.
	await confirmTXs(app.client, {requirePW: true})

	await pending0.waitForExist({reverse: true})
	done()
});

test('Revoke & Unlock CELO', async (done) => {
	const kit = devchainKit()
	const lockedGold = await kit.contracts.getLockedGold()
	const election = await kit.contracts.getElection()
	const a0 = SpectronAccounts[0]

	const vgroup = SpectronAccounts[5]
	await createValidatorGroup(kit, vgroup, SpectronAccounts[6])
	const totalLocked = await lockedGold.getAccountTotalLockedGold(a0)
	expect(totalLocked.toNumber()).toEqual(50e18)
	await (await election
		.vote(vgroup, totalLocked))
		.sendAndWaitForReceipt({from: a0})
	const nonVoting = await lockedGold.getAccountNonvotingLockedGold(a0)
	expect(nonVoting.toNumber()).toEqual(0)

	await refetchAppData(app.client)
	const unlockInput = await app.client.$("#unlock-celo-input")
	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await unlockInput.keys(["15"])
	const unlockCelo = await app.client.$("#unlock-celo")
	await expect(unlockCelo.getText()).resolves.toEqual("REVOKE AND UNLOCK")
	await unlockCelo.click()
	await confirmTXs(app.client, {txCount: 2})
	const totalLockedAfterRevokeAndUnlock = await lockedGold.getAccountTotalLockedGold(a0)
	expect(totalLockedAfterRevokeAndUnlock.toNumber()).toEqual(35e18)

	done()
})