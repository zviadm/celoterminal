import ubeswapTokenList from "@ubeswap/default-token-list/ubeswap.token-list.json"
import celoTokenList from "./celo.tokenlist.json"

import { ConversionFunc, coreErc20s } from "./core"

import { ensureLeading0x } from "@celo/base"
import { toChecksumAddress } from "@celo/utils/lib/address"

interface RegisteredERC20 {
	name: string,
	symbol: string,
	addresses: {
		mainnet?: string,
		baklava?: string,
		alfajores?: string,
	},
	decimals: number,
	conversion?: ConversionFunc,
}

const _erc20Registry: RegisteredERC20[] = [
	{
		name: "Release Ube",
		symbol: "rUBE",
		decimals: 18,
		addresses: {
			mainnet: "0x5Ed248077bD07eE9B530f7C40BE0c1dAE4c131C0",
		},
	},
	{
		name: "Tether USD",
		symbol: "USD₮",
		decimals: 6,
		addresses: {
			mainnet: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
		},
	},
]

export const erc20Registry: RegisteredERC20[] = (() => {
	const setOfAddrs = new Set<string>()
	const setOfSymbols = new Set<string>()
	_erc20Registry.forEach((r) => {
		if (r.addresses.mainnet) {
			setOfAddrs.add(r.addresses.mainnet)
		}
		setOfSymbols.add(r.symbol)
	})
	coreErc20s.forEach((r) => setOfSymbols.add(r.symbol))

	const tokensAll = [
		...celoTokenList.tokens,
		...ubeswapTokenList.tokens,
	]
	const erc20s: RegisteredERC20[] = []
	tokensAll.forEach((t) => {
		const address = ensureLeading0x(toChecksumAddress(t.address))
		if (t.chainId !== 42220 ||
			setOfAddrs.has(address) ||
			coreErc20s.find((r) => r.symbol === t.symbol)) {
			return
		}
		setOfAddrs.add(t.address)
		let symbol = t.symbol
		while (setOfSymbols.has(symbol)) {
			console.info(`REGISTRY: symbol conflict: ${symbol}`)
			symbol = symbol + " "
		}
		setOfSymbols.add(symbol)
		erc20s.push({
			name: t.name,
			symbol: symbol,
			decimals: t.decimals,
			addresses: {
				mainnet: address,
			}
		})
	})
	return [..._erc20Registry, ...erc20s]
})()
