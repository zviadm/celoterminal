import * as ubeswapTokenList from "@ubeswap/default-token-list/ubeswap.token-list.json"
import * as celoTokenList from "./celo.tokenlist.json"

import { ConversionFunc, coreErc20s } from "./core"
import { convertSCELO } from "./conversions/savingscelo"

import { SavingsCELOAddressAlfajores, SavingsCELOAddressBaklava } from "savingscelo"
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
		name: "Savings CELO (Deprecated)",
		symbol: "sCELOxDEPRECATED",
		decimals: 18,
		conversion: convertSCELO,
		addresses: {
			mainnet: "0x2879BFD5e7c4EF331384E908aaA3Bd3014b703fA",
			baklava: SavingsCELOAddressBaklava,
			alfajores: SavingsCELOAddressAlfajores,
		},
	},
	{
		name: "Release Ube",
		symbol: "rUBE",
		decimals: 18,
		addresses: {
			mainnet: "0x5Ed248077bD07eE9B530f7C40BE0c1dAE4c131C0",
		},
	},
	{
		name: "Ubeswap LP Token (CELO+sCELOxDEPRECATED)",
		symbol: "ULP-CELO+sCELOxDEPRECATED",
		decimals: 18,
		addresses: {
			mainnet: "0xa813Bb1DF70128d629F1A41830578fA616dAEeEc",
			alfajores: "0x58a3dc80EC8b6aE44AbD2e2b2A30F230b14B45c3",
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
