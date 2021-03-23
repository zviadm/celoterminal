import { app, devchainKit, jestSetup } from '../../../../lib/spectron-utils/setup'
import { adjustNow, confirmTXs, refetchAppData, selectApp } from '../../../../lib/spectron-utils/app-helpers'
import { SpectronAccounts, spectronDefaultAccount } from '../../../../lib/spectron-utils/constants';
import { createValidatorGroup } from '../../../../lib/spectron-utils/devchain-helpers';

jestSetup()

test('Create account', async (done) => {
	await selectApp("locker")

	const createAccount = await app.client.$("#create-account")
	await createAccount.waitForEnabled()
	await createAccount.click()
	await confirmTXs()

	done()
});

test('Lock & Unlock CELO', async (done) => {
	const lockInput = await app.client.$("#lock-celo-input")
	await lockInput.waitForEnabled()
	await lockInput.click()
	await lockInput.keys(["100"])
	const lockCelo = await app.client.$("#lock-celo")
	await lockCelo.click()
	await confirmTXs()

	const unlockTab = await app.client.$("span=Unlock")
	await unlockTab.waitForEnabled()
	await unlockTab.click()
	const unlockInput = await app.client.$("#unlock-celo-input")
	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await unlockInput.keys(["50"])
	const unlockCelo = await app.client.$("#unlock-celo")
	await unlockCelo.click()
	await confirmTXs()

	const pending0 = await app.client.$("#withdraw-0")
	await pending0.waitForExist()
	await expect(pending0.isEnabled()).resolves.toBe(false)

	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await unlockInput.keys(["25"])
	await unlockCelo.click()
	await confirmTXs()

	const pending1 = await app.client.$("#cancel-withdraw-1")
	await pending1.waitForEnabled()
	await pending1.click()
	await confirmTXs()

	await pending1.waitForExist({reverse: true})

	const kit = devchainKit()
	const cfg = await kit.getNetworkConfig()
	// Pass time to enable withdraws.
	await adjustNow(cfg.lockedGold.unlockingPeriod.multipliedBy(1000).toNumber())
	await refetchAppData()

	await pending0.waitForEnabled()
	await pending0.click()
	// since 3 days have passed, we need to set `requirePW` because cached password
	// would have expired already.
	await confirmTXs()

	await pending0.waitForExist({reverse: true})
	done()
});

test('Revoke & Unlock CELO', async (done) => {
	const kit = devchainKit()
	const lockedGold = await kit.contracts.getLockedGold()
	const election = await kit.contracts.getElection()

	const vgroup = SpectronAccounts[5]
	await createValidatorGroup(kit, vgroup, SpectronAccounts[6])
	const totalLocked = await lockedGold.getAccountTotalLockedGold(spectronDefaultAccount)
	expect(totalLocked.toNumber()).toEqual(50e18)
	await (await election
		.vote(vgroup, totalLocked))
		.sendAndWaitForReceipt({from: spectronDefaultAccount})
	const nonVoting = await lockedGold.getAccountNonvotingLockedGold(spectronDefaultAccount)
	expect(nonVoting.toNumber()).toEqual(0)

	await refetchAppData()
	const unlockTab = await app.client.$("span=Unlock")
	await unlockTab.waitForEnabled()
	await unlockTab.click()
	const unlockInput = await app.client.$("#unlock-celo-input")
	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await unlockInput.keys(["15"])
	const unlockCelo = await app.client.$("#unlock-celo")
	await expect(unlockCelo.getText()).resolves.toEqual("REVOKE AND UNLOCK")
	await unlockCelo.click()
	await confirmTXs({txCount: 2})
	const totalLockedAfterRevokeAndUnlock = await lockedGold.getAccountTotalLockedGold(spectronDefaultAccount)
	expect(totalLockedAfterRevokeAndUnlock.toNumber()).toEqual(35e18)

	done()
})

test(`Unlock MAX`, async (done) => {
	const unlockTab = await app.client.$("span=Unlock")
	await unlockTab.waitForEnabled()
	await unlockTab.click()
	const unlockInputSetMax = await app.client.$("#unlock-celo-input-set-max")
	await unlockInputSetMax.waitForEnabled()
	await unlockInputSetMax.click()

	const unlockCelo = await app.client.$("#unlock-celo")
	await unlockCelo.click()
	await confirmTXs({txCount: 2})

	const kit = devchainKit()
	const lockedGold = await kit.contracts.getLockedGold()
	const totalLocked = await lockedGold.getAccountTotalLockedGold(spectronDefaultAccount)
	expect(totalLocked.toNumber()).toEqual(0)

	done()
})