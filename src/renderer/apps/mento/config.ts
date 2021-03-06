import { CeloContract, ContractKit } from '@celo/contractkit'
import { Exchange } from '@celo/contractkit/lib/generated/Exchange'
import { ExchangeWrapper } from '@celo/contractkit/lib/wrappers/Exchange'
import { CoreErc20, coreErc20s, stableTokenSuffix } from '../../../lib/erc20/core'
import Erc20Contract, { newErc20 } from '../../../lib/erc20/erc20-contract'

export const stableTokens = coreErc20s.filter((e) => e.symbol !== "CELO")

export const exchangeAddr = async (
	kit: ContractKit, stableToken: CoreErc20): Promise<string> => {
	const address = await kit.registry.addressFor(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		CeloContract.Exchange + stableTokenSuffix(stableToken) as any)
	return address
}

export const getExchange = async (
	kit: ContractKit,
	stableToken: CoreErc20): Promise<ExchangeWrapper> => {
	const address = await exchangeAddr(kit, stableToken)
	const exchange = await kit.contracts.getContract("Exchange", address)
	return exchange
}

export const getExchangeWeb3 = async (
	kit: ContractKit,
	stableToken: CoreErc20): Promise<Exchange> => {
	const address = await exchangeAddr(kit, stableToken)
	const exchange = await kit._web3Contracts.getContract("Exchange", address)
	return exchange
}

export const getStableToken = async (
	kit: ContractKit, stableToken: CoreErc20): Promise<Erc20Contract> => {
	const stableErc20 = stableTokens.find((t) => t.symbol === stableToken)
	if (!stableErc20) {
		throw new Error(`Unexpected stableToken: ${stableToken}`)
	}
	return newErc20(kit, stableErc20)
}