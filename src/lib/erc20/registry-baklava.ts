import { convertSCELO } from "./conversions/savingscelo"
import { RegisteredErc20 } from "./core"

export const erc20Baklava: RegisteredErc20[] = [
	{
		name: "Savings CELO",
		symbol: "sCELO",
		address: "0x08289E751817A8D27c18D81C900387105714efC3",
		decimals: 18,
		conversion: convertSCELO,
	},
]