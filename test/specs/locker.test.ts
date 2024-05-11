import { browser, $ } from '@wdio/globals'
import { devchainKit } from '../setup'
import { adjustNow, confirmTXs, refetchAppData, selectApp } from '../app-helpers'
import { E2ETestAccounts, e2eTestDefaultAccount } from '../../src/lib/e2e-constants'
import { createValidatorGroup } from '../devchain-helpers';

it('Create account', async () => {
	await selectApp("locker")

	const createAccount = await $("#create-account")
	await createAccount.waitForEnabled()
	await createAccount.click()
	await confirmTXs()
});

it('Lock & Unlock CELO', async () => {
	const lockInput = await $("#lock-celo-input")
	await lockInput.waitForEnabled()
	await lockInput.click()
	await browser.keys(["100"])
	const lockCelo = await $("#lock-celo")
	await lockCelo.click()
	await confirmTXs()

	const unlockTab = await $("span=Unlock")
	await unlockTab.waitForEnabled()
	await unlockTab.click()
	const unlockInput = await $("#unlock-celo-input")
	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await browser.keys(["50"])
	const unlockCelo = await $("#unlock-celo")
	await unlockCelo.click()
	await confirmTXs()

	const pending0 = await $("#withdraw-0")
	await pending0.waitForDisplayed()
	await expect(pending0.isEnabled()).resolves.toEqual(false)

	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await browser.keys(["25"])
	await unlockCelo.click()
	await confirmTXs()

	const pending1 = await $("#cancel-withdraw-1")
	await pending1.waitForEnabled()
	await pending1.click()
	await confirmTXs()

	await expect(pending1.isExisting()).resolves.toEqual(false)

	const kit = devchainKit()
	const lockedGold = await kit.contracts.getLockedGold()
	const cfg = await lockedGold.getConfig()
	// Pass time to enable withdraws.
	await adjustNow(cfg.unlockingPeriod.multipliedBy(1000).toNumber())
	await refetchAppData()

	await pending0.waitForEnabled()
	await pending0.click()
	// since 3 days have passed, we need to set `requirePW` because cached password
	// would have expired already.
	await confirmTXs()

	await expect(pending0.isExisting()).resolves.toEqual(false)
});

it('Revoke & Unlock CELO', async () => {
	const kit = devchainKit()
	const lockedGold = await kit.contracts.getLockedGold()
	const election = await kit.contracts.getElection()

	const vgroup = E2ETestAccounts[5]
	await createValidatorGroup(kit, vgroup, E2ETestAccounts[6])
	const totalLocked = await lockedGold.getAccountTotalLockedGold(e2eTestDefaultAccount)
	expect(totalLocked.toNumber()).toEqual(50e18)
	await (await election
		.vote(vgroup, totalLocked))
		.sendAndWaitForReceipt({from: e2eTestDefaultAccount})
	const nonVoting = await lockedGold.getAccountNonvotingLockedGold(e2eTestDefaultAccount)
	expect(nonVoting.toNumber()).toEqual(0)

	await refetchAppData()
	const unlockTab = await $("span=Unlock")
	await unlockTab.waitForEnabled()
	await unlockTab.click()
	const unlockInput = await $("#unlock-celo-input")
	await unlockInput.waitForEnabled()
	await unlockInput.click()
	await browser.keys(["15"])
	const unlockCelo = await $("#unlock-celo")
	await expect(unlockCelo.getText()).resolves.toEqual("REVOKE AND UNLOCK")
	await unlockCelo.click()
	await confirmTXs({txCount: 2})
	const totalLockedAfterRevokeAndUnlock = await lockedGold.getAccountTotalLockedGold(e2eTestDefaultAccount)
	expect(totalLockedAfterRevokeAndUnlock.toNumber()).toEqual(35e18)
})

it(`Unlock MAX`, async () => {
	const unlockTab = await $("span=Unlock")
	await unlockTab.waitForEnabled()
	await unlockTab.click()
	const unlockInputSetMax = await $("#unlock-celo-input-set-max")
	await unlockInputSetMax.waitForEnabled()
	await unlockInputSetMax.click()

	const unlockCelo = await $("#unlock-celo")
	await unlockCelo.click()
	await confirmTXs({txCount: 2})

	const kit = devchainKit()
	const lockedGold = await kit.contracts.getLockedGold()
	const totalLocked = await lockedGold.getAccountTotalLockedGold(e2eTestDefaultAccount)
	expect(totalLocked.toNumber()).toEqual(0)
})