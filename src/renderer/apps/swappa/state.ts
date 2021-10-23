import * as log from 'electron-log'
import { ContractKit } from '@celo/contractkit'
import { Lock } from '@celo/base/lib/lock'
import BigNumber from 'bignumber.js'
// import { BlockTransactionString } from 'web3-eth'

import { Account } from '../../../lib/accounts/accounts'
import { Address, mainnetRegistriesAll, SwappaManager, swappaRouterV1Address } from '@terminal-fi/swappa'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { CFG, mainnetChainId, registeredErc20s } from '../../../lib/cfg'
import { erc20Addr } from './utils'
import { newErc20 } from '../../../lib/erc20/erc20-contract'
import useOnChainState from '../../state/onchain-state'

import * as React from 'react'
// import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'

let _manager: SwappaManager | undefined
let _tokenWhitelistInitialized: Set<Address> = new Set()
const _managerMX: Lock = new Lock()

const managerGlobal = async (kit: ContractKit, tokenWhitelist: Address[]) => {
	await _managerMX.acquire()
	try {
		const matchLength = tokenWhitelist.length === _tokenWhitelistInitialized.size
		const match = matchLength && tokenWhitelist.every((t) => _tokenWhitelistInitialized.has(t))
		if (!_manager || !match) {
			const chainId = CFG().chainId
			const registries =
				chainId === mainnetChainId ? mainnetRegistriesAll(kit) :
				null
			if (!registries) {
				throw new Error(`Swappa not available on chainId: ${chainId}!`)
			}
			_manager = new SwappaManager(kit, swappaRouterV1Address, registries)
			log.info(`swappa: initializing SwappaManager, tokenWhitelist: ${tokenWhitelist.length}...`)
			await _manager.reinitializePairs(tokenWhitelist)
			_tokenWhitelistInitialized = new Set(tokenWhitelist)
		}
		return _manager
	} finally {
		_managerMX.release()
	}
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useSwappaRouterState = (
	account: Account,
	erc20s: RegisteredErc20[],
	inputToken: RegisteredErc20,
	trade?: {
		outputToken: RegisteredErc20,
		inputAmount: string,
	}) => {
	const tokenWhitelist = React.useMemo(() => {
		const addresses = Array.from(
			new Set([
				...erc20s.map((e) => e.address),
				...registeredErc20s.map((r) => r.address),
				].filter((a) => a) as Address[]).values())
		return addresses
	}, [erc20s])

	const [refreshN, setRefreshN]= React.useState(0)
	const [manager, setManager] = React.useState<SwappaManager | undefined>()
	const refreshPairsState = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const inputErc20 = await newErc20(kit, inputToken)
			const inputBalance = await inputErc20.balanceOf(account.address)

			const manager = await managerGlobal(kit, tokenWhitelist)
			await manager.refreshPairs()
			setManager(manager)
			setRefreshN((n) => n + 1)
			return {
				inputBalance,
			}
		},
		[account, inputToken, tokenWhitelist],
	), {
		autoRefetchSecs: 20,
	})

	const tradeRoute = React.useMemo(() => {
		if (!manager || !trade || refreshN < 0) {
			return null
		}
		const inputAmount = new BigNumber(trade.inputAmount).shiftedBy(inputToken.decimals).integerValue()
		const routes = manager.findBestRoutesForFixedInputAmount(
			erc20Addr(inputToken),
			erc20Addr(trade.outputToken),
			inputAmount)
		return {
			route: routes[0],
		}
	}, [manager, inputToken, trade, refreshN])

	return {
		...refreshPairsState,
		manager,
		tradeRoute: tradeRoute,
	}
}

// export interface TradeEvent {
// 	blockNumber: number
// 	timestamp: Date
// 	txHash: string
// 	exchanger: string
// 	sellAmount: BigNumber
// 	buyAmount: BigNumber
// 	soldGold: boolean
// }

// // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// export const useExchangeHistoryState = (account: Account, stableToken: StableToken) => {
// 	const fetchCallback = React.useCallback(
// 		async (
// 			kit: ContractKit,
// 			fromBlock: number,
// 			toBlock: number,
// 			latestBlock: BlockTransactionString): Promise<TradeEvent[]> => {
// 			const exchangeDirect = await kit._web3Contracts.getExchange(stableToken)
// 			const events = await exchangeDirect.getPastEvents("Exchanged", {
// 				fromBlock,
// 				toBlock,
// 				filter: { exchanger: account.address }
// 			})
// 			return events.map((e) => ({
// 					blockNumber: e.blockNumber,
// 					// Estimate timestamp from just `latestBlock`, since fetching all blocks
// 					// would be prohibitevly expensive.
// 					timestamp: estimateTimestamp(latestBlock, e.blockNumber),
// 					txHash: e.transactionHash,
// 					exchanger: e.returnValues.exchanger,
// 					sellAmount: valueToBigNumber(e.returnValues.sellAmount),
// 					buyAmount: valueToBigNumber(e.returnValues.buyAmount),
// 					soldGold: e.returnValues.soldGold,
// 			}))
// 		}, [account, stableToken],
// 	)

// 	return useEventHistoryState(
// 		fetchCallback, {
// 			maxHistoryDays: 7,
// 			maxEvents: 100,
// 		},
// 	)
// }