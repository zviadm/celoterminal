import { convertMToken } from "./conversions/moola"
import { RegisteredERC20 } from "./core"

export const erc20Mainnet: RegisteredERC20[] = [
	{
		fullName: "Moola:mCELO",
		address: "0x7037F7296B2fc7908de7b57a89efaa8319f0C500",
		conversion: convertMToken,
	},
	{
		fullName: "Moola:mCUSD",
		address: "0x64dEFa3544c695db8c535D289d843a189aa26b98",
		conversion: convertMToken,
	},
]