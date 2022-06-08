import { coreErc20s, coreErc20Decimals } from '../../../lib/erc20/core'
import { CeloTokenType, ContractKit, StableToken, Token } from "@celo/contractkit"

export const stableTokens = coreErc20s.filter((e) => e.symbol !== "CELO")

export const availableRateMode: {
	readonly stable: number,
	readonly variable: number,
} = {
	'stable': 1,
	'variable': 2
}

export const moolaTokens: {
	readonly name: string,
	readonly symbol: CeloTokenType,
	readonly decimals: number,
	readonly addresses: {
		mainnet: string,
		baklava: string,
		alfajores: string,
	}
}[] = [...coreErc20s]