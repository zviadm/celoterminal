import * as ubeswapTokenList from "@ubeswap/default-token-list/ubeswap.token-list.json"

import { ConversionFunc, coreErc20s } from "./core"
import { convertSCELO } from "./conversions/savingscelo"

import { SavingsCELOAddressAlfajores, SavingsCELOAddressBaklava } from "savingscelo"

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
		name: "Fancy Hat",
		symbol: "FAN",
		decimals: 8,
		conversion: convertSCELO,
		addresses: {
			mainnet: "0x236Af241E436E9caC0c7610831ac5ce2b9333AA3",
		},
	},
]

export const erc20Registry: RegisteredERC20[] = (() => {
	const ubeswapErc20s = ubeswapTokenList.tokens.filter((t) =>
		t.chainId === 42220 &&
		!_erc20Registry.find((r) => r.addresses.mainnet === t.address) &&
		!coreErc20s.find((r) => r.symbol === t.symbol)
		)
		.map((t) => ({
			name: t.name,
			symbol: t.symbol,
			decimals: t.decimals,
			addresses: {
				mainnet: t.address,
			}
		}))
	return [..._erc20Registry, ...ubeswapErc20s]
})()
