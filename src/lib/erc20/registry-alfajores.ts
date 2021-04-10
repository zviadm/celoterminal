import { convertMToken } from "./conversions/moola"
import { convertSCELO } from "./conversions/savingscelo"
import { RegisteredErc20 } from "./core"

import { SavingsCELOAddressAlfajores } from "savingscelo"

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
		address: SavingsCELOAddressAlfajores,
		decimals: 18,
		conversion: convertSCELO,
	},
]
