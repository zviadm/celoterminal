import { app, jestSetup } from '../../../../lib/spectron-utils/setup'
import { checkErrorSnack, confirmTXs, installOptionalApp, selectAccount, selectApp, waitForRefetch } from '../../../../lib/spectron-utils/app-helpers'
import { SpectronAccounts } from '../../../../lib/spectron-utils/constants'

jestSetup()

test('create MultiSig account', async (done) => {
	await selectApp("accounts")
	const addAccount = await app.client.$("button=Add Account")
	await addAccount.waitForEnabled()
	await addAccount.click()
	const createMultiSig = await app.client.$("button=Create MultiSig Account")
	await createMultiSig.waitForEnabled()
	await createMultiSig.click()

	const confirmCreate = await app.client.$("button=Create")
	await confirmCreate.waitForEnabled()
	await confirmCreate.click()

	// Deploy contracts && Initialize, total of 4 transactions.
	await confirmTXs({txCount: 4, skipWaitForRefetch: true})

	// select created multisig account. there are 3 test accounts, 4th one will be MultiSig.
	await selectAccount(3)
	done()
})

test('test MultiSig app', async (done) => {
	await installOptionalApp("multisig")
	await waitForRefetch()

	const ownersTab = await app.client.$("span=Owners")
	await ownersTab.waitForClickable()
	await ownersTab.click()

	// Add `A1` account as another owner.
	const addOwner = await app.client.$("button=Add Owner")
	await addOwner.waitForEnabled()
	await addOwner.click()

	const addressInput = await app.client.$("#address-input")
	await addressInput.keys(SpectronAccounts[1])
	const confirmAdd = await app.client.$("#input-address-action")
	await confirmAdd.click()
	await confirmTXs()

	const changeInternalRequired = await app.client.$("#change-internal-required")
	await changeInternalRequired.click()
	const numberInput = await app.client.$("#number-input")
	await numberInput.keys("2")
	const confirmChange = await app.client.$("#input-number-action")
	await confirmChange.click()
	await confirmTXs()

	// This now must require second confirmation from the other owner.
	const changeRequired = await app.client.$("#change-required")
	await changeRequired.click()
	await numberInput.keys("2")
	await confirmChange.click()
	await confirmTXs()

	const transactionsTab = await app.client.$("span=Transactions")
	await transactionsTab.click()

	// revoke confirmation.
	const revokeTX = await app.client.$("button=Revoke")
	await revokeTX.click()
	await confirmTXs()

	// reconfirm TX.
	const confirmTX = await app.client.$("button=Confirm")
	await confirmTX.waitForExist({reverse: true})
	const showNoApprovals = await app.client.$("#show-no-approvals")
	await showNoApprovals.click()
	await confirmTX.waitForClickable()
	await confirmTX.click()
	await confirmTXs()
	done()
})

test(`second owner confirmation`, async (done) => {
	await selectApp("accounts")

	await (await app.client.$("#account-3-settings")).click()
	const ownerInput = await app.client.$("#multisig-owner-input")
	await ownerInput.waitForEnabled()
	await ownerInput.click()
	await ownerInput.keys([SpectronAccounts[1], "Enter"])
	const confirmClose = await app.client.$("button=Close")
	await confirmClose.click()

	await selectApp("multisig")
	await waitForRefetch()
	const confirmTX = await app.client.$("button=Confirm")
	await confirmTX.click()
	await confirmTXs()

	await (await app.client.$("div*=no pending transactions")).waitForExist()

	done()
})

test(`remove and re-import MultiSig`, async (done) => {
	await selectApp("accounts")
	const copyAddress = await app.client.$("#copy-selected-account-address")
	await copyAddress.click() // copy multisig address in clipboard.

	const removeAccount = await app.client.$("#account-3-remove")
	await removeAccount.click()
	const confirmRemove = await app.client.$("button=Remove")
	await confirmRemove.waitForEnabled()
	await confirmRemove.click()

	const addAccount = await app.client.$("button=Add Account")
	await addAccount.waitForEnabled()
	await addAccount.click()
	const importMultiSig = await app.client.$("button=Import MultiSig Account")
	await importMultiSig.click()
	const multiSigAddressInput = await app.client.$("#multisig-address-input")
	await multiSigAddressInput.click()
	if (process.platform === "darwin") {
		await multiSigAddressInput.keys(["Command", "v"])
	} else {
		await multiSigAddressInput.keys(["Control", "v"])
	}
	const confirmImport = await app.client.$("button=Import")
	await confirmImport.waitForEnabled()
	await confirmImport.click()

	await checkErrorSnack()
	done()
})