// Largest toBlock - fromBlock Ankr's public Celo RPC accepts. QuickNode allows 10,000.
export const MAX_LOG_BLOCK_SPAN = 1000

// Tried first. A difference of 10,000 is already "over 10000 blocks" on dRPC's free
// plan. 9,999 is accepted there and on QuickNode. Ankr rejects it, and the fetch
// drops to MAX_LOG_BLOCK_SPAN.
export const PREFERRED_LOG_BLOCK_SPAN = 9_999

// Fourteen days at Celo's current 1 second block time.
export const LOG_LOOKBACK_BLOCKS = 14 * 24 * 60 * 60
