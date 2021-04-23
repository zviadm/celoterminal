import { app, devchainKit, jestSetup, testLog } from '../../../../lib/spectron-utils/setup'
import { confirmTXs, installOptionalApp, waitForRefetch } from '../../../../lib/spectron-utils/app-helpers'
import { SpectronAccounts, spectronDefaultAccount } from '../../../../lib/spectron-utils/constants'
import { multiSigDeployTXs, multiSigInitializeTXs } from '../../../../lib/core-contracts/deploy'

jestSetup()

test('install app', async (done) => {
	await installOptionalApp("sc-inspector")
	done()
})

test('test sc-inspector read & write', async (done) => {
	// MultiSig contract is a built-in contract so it is easiest to test with.
	testLog("Deploying MultiSig contracts...")
	const kit = devchainKit()
	const deployTXs = await multiSigDeployTXs(kit)
	const res0 = await deployTXs[0].tx.sendAndWaitForReceipt({from: spectronDefaultAccount})
	const res1 = await deployTXs[1].tx.sendAndWaitForReceipt({from: spectronDefaultAccount})
	if (!res0.contractAddress || !res1.contractAddress) {
		fail("multiSig deploy failure")
	}
	const initTXs = await multiSigInitializeTXs(
		kit,
		res0.contractAddress,
		res1.contractAddress,
		[SpectronAccounts[0]],
		1,
		1,
	)
	for (const tx of initTXs) {
		await tx.tx.sendAndWaitForReceipt({from: spectronDefaultAccount})
	}
	testLog(`Deployed @${res0.contractAddress}`)

	const contractAddress = await app.client.$("#contract-address")
	await contractAddress.keys(res0.contractAddress)
	await waitForRefetch()

	testLog(`Testing getOwners() read call...`)
	const getOwners = await app.client.$("#contract-read-getOwners")
	await getOwners.click()
	const getOwnersResult = await app.client.$("#contract-result-getOwners-0")
	await getOwnersResult.waitForClickable()
	await expect(getOwnersResult.getText()).resolves.toEqual(SpectronAccounts[0])

	testLog(`Testing replaceOwner() through submitTransaction() write call...`)
	const multiSig = await kit.contracts.getMultiSig(res0.contractAddress)
	const replaceTX = multiSig.replaceOwner(SpectronAccounts[0], SpectronAccounts[1])
	const replaceTXData = replaceTX.txo.encodeABI()

	// Test lower-case contractAddress too.
	await contractAddress.doubleClick()
	await contractAddress.keys(res0.contractAddress.toLowerCase())
	await waitForRefetch()

	const writeTab = await app.client.$("span=Write")
	await writeTab.click()
	const addOwner = await app.client.$("#contract-write-submitTransaction")
	await addOwner.click()
	const input0 = await app.client.$("#contract-submitTransaction-destination-input")
	await input0.click()
	await input0.keys(res0.contractAddress)
	const input1 = await app.client.$("#contract-submitTransaction-value-input")
	await input1.click()
	await input1.keys("0")
	const input2 = await app.client.$("#contract-submitTransaction-data-input")
	await input2.click()
	await input2.keys(replaceTXData)
	const execute = await app.client.$("#contract-action-submitTransaction")
	await execute.click()
	await confirmTXs()

	testLog(`Checking owners() for updated result...`)
	const readTab = await app.client.$("span=Read")
	await readTab.click()
	const owners = await app.client.$("#contract-read-owners")
	await owners.click()
	const ownersResult = await app.client.$("#contract-result-owners-0")
	await expect(ownersResult.isExisting()).resolves.toEqual(false)
	const ownersIdxInput = await app.client.$("#contract-owners--input")
	await ownersIdxInput.click()
	await ownersIdxInput.keys("0")
	const query = await app.client.$("#contract-action-owners")
	await query.click()
	await ownersResult.waitForClickable()
	await expect(ownersResult.getText()).resolves.toEqual(SpectronAccounts[1])

	// TODO(zviadm): need a test for making call to a `payable` function. Unfortunately
	// MultiSig contract doesn't have any payable functions to test.
	done()
})
