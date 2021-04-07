import { convertMToken } from "./conversions/moola"
import { convertSCELO } from "./conversions/savingscelo"
import { RegisteredErc20 } from "./core"

export const erc20Alfajores: RegisteredErc20[] = [
	{
		name: "Moola CELO AToken",
		symbol: "mCELO",
		address: "0x86f61EB83e10e914fc6F321F5dD3c2dD4860a003",
		decimals: 18,
		conversion: convertMToken,
	},
	{
		name: "Moola cUSD AToken",
		symbol: "mCUSD",
		address: "0x71DB38719f9113A36e14F409bAD4F07B58b4730b",
		decimals: 18,
		conversion: convertMToken,
	},
	{
		name: "Savings CELO",
		symbol: "sCELO",
		address: "0x1E2B33c756c8f0709A5867ED7408e740F717012A",
		decimals: 18,
		conversion: convertSCELO,
	},
]
