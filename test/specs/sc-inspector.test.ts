import { browser, $ } from '@wdio/globals'
import { devchainKit, testLog } from '../setup'
import { confirmTXs, installOptionalApp, waitForRefetch } from '../app-helpers'
import { E2ETestAccounts, e2eTestDefaultAccount } from '../../src/lib/e2e-constants'
import { multiSigDeployTXs, multiSigInitializeTXs } from '../../src/lib/core-contracts/deploy'

it('install app', async () => {
	await installOptionalApp("sc-inspector")
})

it('test sc-inspector read & write', async () => {
	// MultiSig contract is a built-in contract so it is easiest to test with.
	testLog("Deploying MultiSig contracts...")
	const kit = devchainKit()
	const deployTXs = await multiSigDeployTXs(kit)
	const res0 = await deployTXs[0].tx.sendAndWaitForReceipt({from: e2eTestDefaultAccount})
	const res1 = await deployTXs[1].tx.sendAndWaitForReceipt({from: e2eTestDefaultAccount})
	if (!res0.contractAddress || !res1.contractAddress) {
		throw new Error("multiSig deploy failure")
	}
	const initTXs = await multiSigInitializeTXs(
		kit,
		res0.contractAddress,
		res1.contractAddress,
		[E2ETestAccounts[0]],
		1,
		1,
	)
	for (const tx of initTXs) {
		await tx.tx.sendAndWaitForReceipt({from: e2eTestDefaultAccount})
	}
	testLog(`Deployed @${res0.contractAddress}`)

	const contractAddress = await $("#contract-address")
	await contractAddress.click()
	await browser.keys(res0.contractAddress)
	await waitForRefetch()

	testLog(`Testing getOwners() read call...`)
	const getOwners = await $("#contract-read-getOwners")
	await getOwners.click()
	const getOwnersResult = await $("#contract-result-getOwners-0")
	await getOwnersResult.waitForClickable()
	await expect(getOwnersResult.getText()).resolves.toEqual(E2ETestAccounts[0])

	testLog(`Testing replaceOwner() through submitTransaction() write call...`)
	const multiSig = await kit.contracts.getMultiSig(res0.contractAddress)
	const replaceTX = multiSig.replaceOwner(E2ETestAccounts[0], E2ETestAccounts[1])
	const replaceTXData = replaceTX.txo.encodeABI()

	// Test lower-case contractAddress too.
	await contractAddress.doubleClick()
	await browser.keys(res0.contractAddress.toLowerCase())
	await waitForRefetch()

	const writeTab = await $("span=Write")
	await writeTab.waitForClickable()
	await writeTab.click()
	const addOwner = await $("#contract-write-submitTransaction")
	await addOwner.waitForClickable()
	await addOwner.click()
	const input0 = await $("#contract-submitTransaction-destination-input")
	await input0.waitForClickable()
	await input0.click()
	await browser.keys(res0.contractAddress)
	const input1 = await $("#contract-submitTransaction-value-input")
	await input1.click()
	await browser.keys("0")
	const input2 = await $("#contract-submitTransaction-data-input")
	await input2.click()
	await browser.keys(replaceTXData)
	const execute = await $("#contract-action-submitTransaction")
	await execute.click()
	await confirmTXs()

	testLog(`Checking owners() for updated result...`)
	const readTab = await $("span=Read")
	await readTab.click()
	const owners = await $("#contract-read-owners")
	await owners.click()
	const ownersResult = await $("#contract-result-owners-0")
	await expect(ownersResult.isExisting()).resolves.toEqual(false)
	const ownersIdxInput = await $("#contract-owners--input")
	await ownersIdxInput.waitForClickable()
	await ownersIdxInput.click()
	await browser.keys("0")
	const query = await $("#contract-action-owners")
	await query.click()
	await ownersResult.waitForClickable()
	await expect(ownersResult.getText()).resolves.toEqual(E2ETestAccounts[1])

	// TODO(zviadm): need a test for making call to a `payable` function. Unfortunately
	// MultiSig contract doesn't have any payable functions to test.
})
