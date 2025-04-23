import * as log from 'electron-log'
import { ContractKit } from '@celo/contractkit'
import { Lock } from '@celo/base/lib/lock'
import BigNumber from 'bignumber.js'
import { BlockTransactionString } from 'web3-eth'

import { Address, mainnetRegistriesWhitelist, SwappaManager, swappaRouterV1Address } from '@terminal-fi/swappa'
import { SwappaRouterV1, ABI as SwappaRouterV1ABI } from '@terminal-fi/swappa/dist/types/web3-v1-contracts/SwappaRouterV1'

import { Account } from '../../../lib/accounts/accounts'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { CFG, mainnetChainId, registeredErc20s, selectAddress } from '../../../lib/cfg'
import { erc20StaticAddress } from '../../../lib/erc20/erc20-contract'
import useOnChainState from '../../state/onchain-state'
import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'

import * as React from 'react'

export const routerAddr = selectAddress({
	mainnet: swappaRouterV1Address,
})

let _manager: SwappaManager | undefined
let _tokenWhitelistInitialized: Set<Address> = new Set()
let _managerReInitMs = 0
let _managerRefreshMs = 0
const managerReinitializeSecs = 60 * 60
const managerRefreshSecs = 60
const _managerMX: Lock = new Lock()

const managerGlobal = async (kit: ContractKit, tokenWhitelist?: Address[]): Promise<SwappaManager> => {
	if (!routerAddr) {
		throw new Error(`Swappa not available on chainId: ${CFG().chainId}}!`)
	}
	await _managerMX.acquire()
	try {
		const matchLength = !tokenWhitelist || tokenWhitelist.length === _tokenWhitelistInitialized.size
		const match = matchLength && (!tokenWhitelist || tokenWhitelist.every((t) => _tokenWhitelistInitialized.has(t)))
		if (!_manager || !match) {
			const registries =
				CFG().chainId === mainnetChainId ? mainnetRegistriesWhitelist(kit) :
					[]
			null
			_manager = new SwappaManager(kit, routerAddr, registries)
			if (tokenWhitelist) {
				log.info(`swappa: initializing SwappaManager, tokenWhitelist: ${tokenWhitelist.length}...`)
				await _manager.reinitializePairs(tokenWhitelist)
				_tokenWhitelistInitialized = new Set(tokenWhitelist)
				_managerReInitMs = Date.now()
				_managerRefreshMs = Date.now()
			}
		}
		if (_managerReInitMs + managerReinitializeSecs * 1000.0 < Date.now()) {
			await _manager.reinitializePairs(Array.from(_tokenWhitelistInitialized))
			_managerReInitMs = Date.now()
			_managerRefreshMs = Date.now()
		}
		return _manager
	} finally {
		_managerMX.release()
	}
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useSwappaRouterState = (
	erc20s: RegisteredErc20[],
	inputToken: RegisteredErc20,
	trade?: {
		outputToken: RegisteredErc20,
		inputAmount: string,
	}) => {
	const tokenWhitelist = React.useMemo(() => {
		const addresses = Array.from(
			new Set([
				...erc20s.map(erc20StaticAddress),
				...registeredErc20s.map(erc20StaticAddress),
			].filter((a) => a) as Address[]).values())
		return addresses
	}, [erc20s])

	const [refreshN, setRefreshN] = React.useState(0)
	const [manager, setManager] = React.useState<SwappaManager | undefined>()
	const refreshPairsState = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const manager = await managerGlobal(kit, tokenWhitelist)
			if (_managerRefreshMs + managerRefreshSecs * 1000.0 < Date.now()) {
				await manager.refreshPairs()
			}
			setManager(manager)
			setRefreshN((n) => n + 1)
		},
		[tokenWhitelist],
	), {
		autoRefetchSecs: managerRefreshSecs,
	})
	const refetch = () => {
		_managerRefreshMs = 0
		return refreshPairsState.refetch()
	}

	const tradeRoute = React.useMemo(() => {
		if (!manager || !trade || refreshN < 0) {
			return null
		}
		const inputAmount = new BigNumber(trade.inputAmount).shiftedBy(inputToken.decimals).integerValue()
		const routes = manager.findBestRoutesForFixedInputAmount(
			erc20StaticAddress(inputToken),
			erc20StaticAddress(trade.outputToken),
			inputAmount)
		const route = routes.length > 0 ? routes[0] : null
		return { inputToken, inputAmount, route }
	}, [manager, inputToken, trade, refreshN])

	return {
		...refreshPairsState,
		refetch,
		tradeRoute: tradeRoute,
	}
}

export interface TradeEvent {
	blockNumber: number
	timestamp: Date
	txHash: string
	sender: string
	input: string
	output: string
	inputAmount: BigNumber
	outputAmount: BigNumber
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useSwappaHistoryState = (account: Account) => {
	const fetchCallback = React.useCallback(
		async (
			kit: ContractKit,
			fromBlock: number,
			toBlock: number,
			latestBlock: BlockTransactionString): Promise<TradeEvent[]> => {
			if (!routerAddr) {
				throw new Error(`Swappa not available on chainId: ${CFG().chainId}}!`)
			}
			const router = new kit.web3.eth.Contract(SwappaRouterV1ABI, routerAddr) as unknown as SwappaRouterV1

			const events = await router.getPastEvents("Swap", {
				fromBlock,
				toBlock,
				filter: { sender: account.address }
			})
			return events.map((e) => ({
				blockNumber: e.blockNumber,
				// Estimate timestamp from just `latestBlock`, since fetching all blocks
				// would be prohibitevly expensive.
				timestamp: estimateTimestamp(latestBlock, e.blockNumber),
				txHash: e.transactionHash,
				sender: e.returnValues.sender,
				input: e.returnValues.input,
				output: e.returnValues.output,
				inputAmount: new BigNumber(e.returnValues.inputAmount),
				outputAmount: new BigNumber(e.returnValues.outputAmount),
			}))
		}, [account],
	)

	return useEventHistoryState(
		fetchCallback, {
		maxHistoryHours: 1,
		maxEvents: 100,
	},
	)
}
