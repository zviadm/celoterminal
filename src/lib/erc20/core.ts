import { CeloTokenType, ContractKit, StableToken, Token } from "@celo/contractkit"
import BigNumber from "bignumber.js"

export const coreErc20Decimals = 18
export const coreErc20_CELO = {
	name: "Celo Native Asset",
	symbol: Token.CELO,
	decimals: coreErc20Decimals,
	addresses: {
		mainnet: "0x471EcE3750Da237f93B8E339c536989b8978a438",
		baklava: "0xdDc9bE57f553fe75752D61606B94CBD7e0264eF8",
		alfajores: "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9",
	}
}
export const coreErc20_cUSD = {
	name: "Celo Dollar",
	symbol: StableToken.cUSD,
	decimals: coreErc20Decimals,
	addresses: {
		mainnet: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
		baklava: "0x62492A644A588FD904270BeD06ad52B9abfEA1aE",
		alfajores: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
	}
}
export const coreErc20_cEUR = {
	name: "Celo Euro",
	symbol: StableToken.cEUR,
	decimals: coreErc20Decimals,
	addresses: {
		mainnet: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
		baklava: "0xf9ecE301247aD2CE21894941830A2470f4E774ca",
		alfajores: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
	}
}
export const coreErc20_cREAL = {
	name: "Celo Brazilian Real",
	symbol: StableToken.cREAL,
	decimals: coreErc20Decimals,
	addresses: {
		mainnet: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787",
		baklava: "",
		alfajores: "0xE4D517785D091D3c54818832dB6094bcc2744545",
	}
}
export const coreErc20s: {
	readonly name: string,
	readonly symbol: CeloTokenType,
	readonly decimals: number,
	readonly addresses: {
		mainnet: string,
		baklava: string,
		alfajores: string,
	}
}[] = [
	coreErc20_CELO,
	coreErc20_cUSD,
	coreErc20_cEUR,
	coreErc20_cREAL,
]
export const coreStableTokens = coreErc20s.filter((e) => e.symbol !== "CELO")

export type ConversionFunc = (
	kit: ContractKit, erc20: RegisteredErc20, amount: BigNumber) => Promise<{coreErc20: CeloTokenType, amount: BigNumber}>

export interface RegisteredErc20 {
	readonly name: string,
	readonly symbol: string,
	readonly decimals: number,
	readonly address?: string, // address isn't set for core Celo tokens.

	// Conversion functions can be defined to provide conversion between
	// an ERC20 token and any of the core Celo tokens.
	readonly conversion?: ConversionFunc,
}

export const Erc20InfiniteAmount = new BigNumber("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
export const Erc20InfiniteThreshold = new BigNumber("0xf000000000000000000000000000000000000000000000000000000000000000")