import { browser, $ } from '@wdio/globals'
import { devchainKit } from '../setup'
import { confirmTXs, selectAccount, selectApp, waitForRefetch } from '../app-helpers'
import { E2ETestAccounts } from '../../src/lib/e2e-constants'

it('select app', async () => {
	await selectApp("send-receive")
	await waitForRefetch()
})

it('simple send', async () => {
	const randomAddr = devchainKit().web3.utils.randomHex(20)
	const toAddressInput = await $("#to-address-input")
	await toAddressInput.waitForEnabled()
	await toAddressInput.click()
	await browser.keys(randomAddr)

	const amountInput = await $("#amount-input")
	await amountInput.click()
	await browser.keys("101")

	const send = await $("#send")
	await send.click()
	await confirmTXs()

	const kit = devchainKit()
	const goldToken = await kit.contracts.getGoldToken()
	const balanceCELO = await goldToken.balanceOf(randomAddr)
	expect(balanceCELO.toNumber()).toEqual(101e18)

	const erc20Select = await $("#erc20-select")
	await erc20Select.waitForEnabled()
	await erc20Select.click()

	const erc20cusd = await $("#erc20-cUSD-item")
	await erc20cusd.waitForEnabled()
	await erc20cusd.click()

	await amountInput.click()
	await browser.keys("201")
	await send.click()
	await confirmTXs()

	const stableToken = await kit.contracts.getStableToken()
	const balanceCUSD = await stableToken.balanceOf(randomAddr)
	expect(balanceCUSD.toNumber()).toEqual(201e18)
})

it('add/remove erc20', async () => {
	const erc20Select = await $("#erc20-select")
	await erc20Select.waitForEnabled()
	await erc20Select.click()

	const addToken = await $("#add-token")
	await addToken.waitForEnabled()
	await addToken.click()

	const registeredErc20 = await $("#registered-erc20")
	await registeredErc20.waitForEnabled()
	await registeredErc20.click()
	await browser.keys(["tCELO", "Enter"])
	const confirmAddToken = await $("#confirm-add-erc20")
	await confirmAddToken.waitForEnabled()
	await confirmAddToken.click()
	await waitForRefetch()

	const removeToken_tCELO = await $("#remove-token-tCELO")
	await removeToken_tCELO.waitForDisplayed()
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
	const customTab = await $("span*=Custom Token")
	await customTab.waitForClickable()
	await customTab.click()

	const erc20Address = await $("#erc20-address")
	await erc20Address.click()
	await browser.keys("0x10A736A7b223f1FE1050264249d1aBb975741E75")
	await confirmAddToken.waitForEnabled()
	await confirmAddToken.click()
	await waitForRefetch()

	const randomAddr = devchainKit().web3.utils.randomHex(20)
	const toAddressInput = await $("#to-address-input")
	await toAddressInput.waitForEnabled()
	await toAddressInput.doubleClick()
	await browser.keys(randomAddr)
	const amountInput = await $("#amount-input")
	await amountInput.click()
	await browser.keys("202.1")
	const send = await $("#send")
	await send.click()
	await confirmTXs()

	const kit = devchainKit()
	const stableToken = await kit.contracts.getStableToken()
	const balanceCUSD = await stableToken.balanceOf(randomAddr)
	expect(balanceCUSD.toNumber()).toEqual(202.1e18)
})

it('approvals & transferFrom', async () => {
	const erc20Select = await $("#erc20-select")
	await erc20Select.waitForEnabled()
	await erc20Select.click()
	const erc20cusd = await $("#erc20-cUSD-item")
	await erc20cusd.waitForEnabled()
	await erc20cusd.click()
	await selectAccount(1)
	const approvalsTab = await $("span*=Approvals")
	await approvalsTab.click()
	await waitForRefetch()

	const approveSpender = await $("button*=Approve Spender")
	await approveSpender.waitForEnabled()
	await approveSpender.click()

	const spenderInput = await $("#spender-input")
	await spenderInput.click()
	await browser.keys(E2ETestAccounts[0])
	const amountInput = await $("#amount-input")
	await amountInput.click()
	await browser.keys("100")

	const approve = await $("#confirm-approve")
	await approve.waitForEnabled()
	await approve.click()
	await confirmTXs()

	await selectAccount(0)
	const transferFromTab = await $("span*=Transfer From")
	await transferFromTab.click()
	const fromAddressInput = await $("#from-address-input")
	await fromAddressInput.click()
	await browser.keys([E2ETestAccounts[1].slice(0, 6), "Enter"])

	const randomAddr = devchainKit().web3.utils.randomHex(20)
	const toAddressInput = await $("#to-address-input")
	await toAddressInput.click()
	await browser.keys(randomAddr)

	await amountInput.click()
	await browser.keys("55")

	const send = await $("#send")
	await send.click()
	await confirmTXs()

	const stableToken = await devchainKit().contracts.getStableToken()
	const balance = await stableToken.balanceOf(randomAddr)
	const allowance = await stableToken.allowance(E2ETestAccounts[1], E2ETestAccounts[0])
	expect(allowance.toNumber()).toEqual(45e18)
	expect(balance.toNumber()).toEqual(55e18)
})