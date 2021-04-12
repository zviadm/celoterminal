import { ConversionFunc } from "./core"

import { convertMToken } from "./conversions/moola"
import { convertSCELO } from "./conversions/savingscelo"

import { SavingsCELOAddressAlfajores, SavingsCELOAddressBaklava } from "savingscelo"

export const erc20Registry: {
	name: string,
	symbol: string,
	addresses: {
		mainnet?: string,
		baklava?: string,
		alfajores?: string,
	},
	decimals: number,
	conversion?: ConversionFunc,
}[] = [
	{
		name: "Moola CELO AToken",
		symbol: "mCELO",
		decimals: 18,
		conversion: convertMToken,
		addresses: {
			mainnet: "0x7037F7296B2fc7908de7b57a89efaa8319f0C500",
			alfajores: "0x86f61EB83e10e914fc6F321F5dD3c2dD4860a003",
		},
	},
	{
		name: "Moola cUSD AToken",
		symbol: "mCUSD",
		decimals: 18,
		conversion: convertMToken,
		addresses: {
			mainnet: "0x64dEFa3544c695db8c535D289d843a189aa26b98",
			alfajores: "0x71DB38719f9113A36e14F409bAD4F07B58b4730b",
		},
	},
	{
		name: "Savings CELO",
		symbol: "sCELO",
		decimals: 18,
		conversion: convertSCELO,
		addresses: {
			mainnet: "0x2879BFD5e7c4EF331384E908aaA3Bd3014b703fA",
			baklava: SavingsCELOAddressBaklava,
			alfajores: SavingsCELOAddressAlfajores,
		},
	},
]