import { coreErc20s, coreErc20Decimals } from '../../../lib/erc20/core'
import { CeloTokenType, ContractKit, StableToken, Token } from "@celo/contractkit"

export const stableTokens = coreErc20s.filter((e) => e.symbol !== "CELO")

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