import { coreErc20s } from '../../../lib/erc20/core'

export const stableTokens = coreErc20s.filter((e) => e.symbol !== "CELO")
