import { convertMToken } from "./conversions/moola"
import { RegisteredErc20 } from "./core"

export const erc20Mainnet: RegisteredErc20[] = [
	{
		name: "Moola CELO AToken",
		symbol: "mCELO",
		address: "0x7037F7296B2fc7908de7b57a89efaa8319f0C500",
		decimals: 18,
		conversion: convertMToken,
	},
	{
		name: "Moola cUSD AToken",
		symbol: "mCUSD",
		address: "0x64dEFa3544c695db8c535D289d843a189aa26b98",
		decimals: 18,
		conversion: convertMToken,
	},
]