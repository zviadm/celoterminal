import { app, devchainKit, jestSetup } from '../../../../lib/spectron-utils/setup'
import { confirmTXs, selectApp, waitForRefetch } from '../../../../lib/spectron-utils/app-helpers'

jestSetup()

test('select app', async (done) => {
	await selectApp("send-receive")
	done()
})

test('simple send', async (done) => {
	const randomAddr = "0x000100020003000400050006000700080009000a"
	const toAddressInput = await app.client.$("#to-address-input")
	await toAddressInput.waitForEnabled()
	await toAddressInput.click()
	await toAddressInput.keys(randomAddr)

	const amountInput = await app.client.$("#amount-input")
	await amountInput.click()
	await amountInput.keys("101")

	const send = await app.client.$("#send")
	await send.click()
	await confirmTXs()

	const kit = devchainKit()
	const goldToken = await kit.contracts.getGoldToken()
	const balanceCELO = await goldToken.balanceOf(randomAddr)
	expect(balanceCELO.toNumber()).toEqual(101e18)

	const erc20Select = await app.client.$("#erc20-select")
	await erc20Select.waitForEnabled()
	await erc20Select.click()

	const erc20cusd = await app.client.$("#erc20-cUSD-item")
	await erc20cusd.waitForEnabled()
	await erc20cusd.click()

	await amountInput.click()
	await amountInput.keys("201")
	await send.click()
	await confirmTXs()

	const stableToken = await kit.contracts.getStableToken()
	const balanceCUSD = await stableToken.balanceOf(randomAddr)
	expect(balanceCUSD.toNumber()).toEqual(201e18)

	done()
})

test('add/remove erc20', async (done) => {
	const erc20Select = await app.client.$("#erc20-select")
	await erc20Select.waitForEnabled()
	await erc20Select.click()

	const addToken = await app.client.$("#add-token")
	await addToken.waitForEnabled()
	await addToken.click()

	const registeredErc20 = await app.client.$("#registered-erc20")
	await registeredErc20.waitForEnabled()
	await registeredErc20.keys(["tCELO", "Enter"])
	const confirmAddToken = await app.client.$("#confirm-add-erc20")
	await confirmAddToken.waitForEnabled()
	await confirmAddToken.click()
	await waitForRefetch()

	const removeToken_tCELO = await app.client.$("#remove-token-SpectronTest-tCELO")
	await removeToken_tCELO.waitForExist()
	// TODO(zviad): Figure out how to click the remove button
	// await erc20Select.click()
	// await removeToken_tCELO.waitForEnabled()
	// await removeToken_tCELO.click()

	// const confirmRemoveToken = await app.client.$("#confirm-remove-erc20")
	// await confirmRemoveToken.waitForEnabled()
	// await confirmRemoveToken.click()

	// await removeToken_tCELO.waitForExist({reverse:true})

	await erc20Select.click()
	await addToken.click()
	const customTab = await app.client.$("span*=Custom Token")
	await customTab.waitForExist()
	await customTab.click()

	const erc20Address = await app.client.$("#erc20-address")
	await erc20Address.keys("0x10A736A7b223f1FE1050264249d1aBb975741E75")
	await confirmAddToken.waitForEnabled()
	await confirmAddToken.click()
	await waitForRefetch()

	const randomAddr = "0x000100020003000400050006000700080009000b"
	const toAddressInput = await app.client.$("#to-address-input")
	await toAddressInput.waitForEnabled()
	await toAddressInput.click()
	await toAddressInput.keys(randomAddr)
	const amountInput = await app.client.$("#amount-input")
	await amountInput.click()
	await amountInput.keys("202.1")
	const send = await app.client.$("#send")
	await send.click()
	await confirmTXs()

	const kit = devchainKit()
	const stableToken = await kit.contracts.getStableToken()
	const balanceCUSD = await stableToken.balanceOf(randomAddr)
	expect(balanceCUSD.toNumber()).toEqual(202.1e18)

	done()
})