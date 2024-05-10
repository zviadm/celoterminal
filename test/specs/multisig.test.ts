import { browser, $ } from '@wdio/globals'
import { checkErrorSnack, confirmTXs, installOptionalApp, selectAccount, selectApp, waitForRefetch } from '../app-helpers'
import { E2ETestAccounts } from '../../src/lib/e2e-constants'

it('create MultiSig account', async () => {
	await selectApp("accounts")
	const addAccount = await $("button=Add Account")
	await addAccount.waitForEnabled()
	await addAccount.click()
	const createMultiSig = await $("button=Create MultiSig Account")
	await createMultiSig.waitForEnabled()
	await createMultiSig.click()

	const confirmCreate = await $("button=Create")
	await confirmCreate.waitForEnabled()
	await confirmCreate.click()

	// Deploy contracts && Initialize, total of 4 transactions.
	await confirmTXs({txCount: 4, skipWaitForRefetch: true})
})

it('test MultiSig app', async () => {
	await installOptionalApp("multisig")
	await waitForRefetch()

	// select created multisig account. there are 3 test accounts, 4th one will be MultiSig.
	await selectAccount(3)
	await waitForRefetch()

	const ownersTab = await $("span=Owners")
	await ownersTab.waitForClickable()
	await ownersTab.click()

	// Add `A1` account as another owner.
	const addOwner = await $("button=Add Owner")
	await addOwner.waitForEnabled()
	await addOwner.click()

	const addressInput = await $("#address-input")
	await addressInput.click()
	await browser.keys(E2ETestAccounts[1])
	const confirmAdd = await $("#input-address-action")
	await confirmAdd.click()
	await confirmTXs()

	const changeInternalRequired = await $("#change-internal-required")
	await changeInternalRequired.click()
	const numberInput = await $("#number-input")
	await numberInput.click()
	await browser.keys("2")
	const confirmChange = await $("#input-number-action")
	await confirmChange.click()
	await confirmTXs()

	// This now must require second confirmation from the other owner.
	const changeRequired = await $("#change-required")
	await changeRequired.click()
	await numberInput.click()
	await browser.keys("2")
	await confirmChange.click()
	await confirmTXs()

	const transactionsTab = await $("span=Transactions")
	await transactionsTab.click()

	// revoke confirmation.
	const revokeTX = await $("button=Revoke")
	await revokeTX.click()
	await confirmTXs()

	// reconfirm TX.
	const confirmTX = await $("button=Confirm")
	await expect(confirmTX.isExisting()).resolves.toEqual(false)
	const showNoApprovals = await $("#show-no-approvals")
	await showNoApprovals.click()
	await confirmTX.waitForClickable()
	await confirmTX.click()
	await confirmTXs()
})

it(`second owner confirmation`, async () => {
	await selectApp("accounts")

	await (await $("#account-3-settings")).click()
	const ownerInput = await $("#multisig-owner-input")
	await ownerInput.waitForEnabled()
	await ownerInput.doubleClick()
	await browser.keys([E2ETestAccounts[1], "Enter"])
	const confirmClose = await $("button=Close")
	await confirmClose.click()

	await selectApp("multisig")
	await waitForRefetch()
	const confirmTX = await $("button=Confirm")
	await confirmTX.click()
	await confirmTXs()

	await (await $("div*=no pending transactions")).waitForDisplayed()
})

it(`remove and re-import MultiSig`, async () => {
	await selectApp("accounts")
	const copyAddress = await $("#copy-selected-account-address")
	await copyAddress.click() // copy multisig address in clipboard.

	const removeAccount = await $("#account-3-remove")
	await removeAccount.click()
	const confirmRemove = await $("button=Remove")
	await confirmRemove.waitForEnabled()
	await confirmRemove.click()

	const addAccount = await $("button=Add Account")
	await addAccount.waitForEnabled()
	await addAccount.click()
	const importMultiSig = await $("button=Import MultiSig Account")
	await importMultiSig.click()
	const multiSigAddressInput = await $("#multisig-address-input")
	await multiSigAddressInput.click()
	if (process.platform === "darwin") {
		await browser.keys(["Command", "v"])
	} else {
		await browser.keys(["Control", "v"])
	}
	const confirmImport = await $("button=Import")
	await confirmImport.waitForEnabled()
	await confirmImport.click()

	await checkErrorSnack()
})