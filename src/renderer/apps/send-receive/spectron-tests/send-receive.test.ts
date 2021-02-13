import { app, devchainKit, jestSetup } from '../../../../lib/spectron-utils/setup'
import { confirmTXs } from '../../../../lib/spectron-utils/helpers'

jestSetup()

test('Send ', async (done) => {
	// const menuSend = await app.client.$("#menu-send-receive")
	// await menuSend.waitForEnabled()
	// await menuSend.click()

	// const randomAddr = "0x000100020003000400050006000700080009000a"
	// const toAddressInput = await app.client.$("#to-address-input")
	// await toAddressInput.waitForEnabled()
	// await toAddressInput.click()
	// await toAddressInput.keys(randomAddr)

	// const amountInput = await app.client.$("#amount-input")
	// await amountInput.click()
	// await amountInput.keys("101")

	// const send = await app.client.$("#send")
	// await send.click()
	// await confirmTXs(app.client)

	// const kit = devchainKit()
	// const goldToken = await kit.contracts.getGoldToken()
	// const balanceCELO = await goldToken.balanceOf(randomAddr)
	// expect(balanceCELO.toNumber()).toEqual(101e18)

	// const erc20Select = await app.client.$("#erc20-select")
	// await erc20Select.waitForEnabled()
	// await erc20Select.click()

	// const erc20cusd = await app.client.$("#erc20-cUSD-item")
	// await erc20cusd.waitForEnabled()
	// await erc20cusd.click()

	// await amountInput.click()
	// await amountInput.keys("201")
	// await send.click()
	// await confirmTXs(app.client)

	// const stableToken = await kit.contracts.getStableToken()
	// const balanceCUSD = await stableToken.balanceOf(randomAddr)
	// expect(balanceCUSD.toNumber()).toEqual(201e18)

	done()
});
