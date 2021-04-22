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
	{
		name: "Ubeswap LP Token (CELO+sCELO)",
		symbol: "ULP-CELO+sCELO",
		decimals: 18,
		addresses: {
			mainnet: "0xa813Bb1DF70128d629F1A41830578fA616dAEeEc",
			alfajores: "0x58a3dc80EC8b6aE44AbD2e2b2A30F230b14B45c3",
		},
	},
	{
		name: "Ubeswap",
		symbol: "UBE",
		decimals: 18,
		addresses: {
			mainnet: "0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC",
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
		name: "Moola cEUR AToken",
		symbol: "mCEUR",
		decimals: 18,
		conversion: convertMToken,
		addresses: {
			// mainnet: "0xa8d0E6799FF3Fd19c6459bf02689aE09c4d78Ba7",
			alfajores: "0x32974C7335e649932b5766c5aE15595aFC269160",
		},
	},
]