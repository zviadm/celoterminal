import { RegisteredErc20 } from "./core"

import { convertSCELO } from "./conversions/savingscelo"

import { SavingsCELOAddressBaklava } from "savingscelo"

export const erc20Baklava: RegisteredErc20[] = [
	{
		name: "Savings CELO",
		symbol: "sCELO",
		address: SavingsCELOAddressBaklava,
		decimals: 18,
		conversion: convertSCELO,
	},
]