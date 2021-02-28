import { convertMToken } from "./conversions/moola"
import { RegisteredErc20 } from "./core"

export const erc20Alfajores: RegisteredErc20[] = [
	{
		fullName: "Moola:mCELO",
		address: "0x86f61EB83e10e914fc6F321F5dD3c2dD4860a003",
		decimals: 18,
		conversion: convertMToken,
	},
	{
		fullName: "Moola:mCUSD",
		address: "0x71DB38719f9113A36e14F409bAD4F07B58b4730b",
		decimals: 18,
		conversion: convertMToken,
	},
]