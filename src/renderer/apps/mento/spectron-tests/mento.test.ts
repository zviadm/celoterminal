import { app, jestSetup } from '../../../../lib/spectron-utils/setup'
import { confirmTXs, installOptionalApp, waitForRefetch } from '../../../../lib/spectron-utils/app-helpers'

jestSetup()

test('install app', async (done) => {
	await installOptionalApp("mento")
	await waitForRefetch()
	done()
})

test('trade CELO <-> cUSD', async (done) => {
	const sellAmountInput = await app.client.$("#sell-amount-input")
	await sellAmountInput.click()
	await sellAmountInput.keys("100")
	const trade = await app.client.$("button=Trade")
	await trade.click()
	const confirmTrade = await app.client.$("#confirm-trade")
	await confirmTrade.waitForEnabled()
	await confirmTrade.click()
	await confirmTXs({txCount: 2}) // first is approval, second is trade.

	await sellAmountInput.click()
	await sellAmountInput.keys("10")
	await trade.click()
	await confirmTrade.waitForEnabled()
	await confirmTrade.click()
	await confirmTXs() // approval no longer necessary.

	const buyCELO = await app.client.$("button=Buy CELO")
	await buyCELO.click()
	const buyAmountInput = await app.client.$("#buy-amount-input")
	await buyAmountInput.click()
	await buyAmountInput.keys("110")
	await trade.click()
	await confirmTrade.waitForEnabled()
	await confirmTrade.click()
	await confirmTXs({txCount: 2}) // approval needed now for cUSD

	done()
})

test('Trade CELO <-> cEUR', async (done) => {
	// TODO(zviad): Test out cEUR trading.
	done()
})
