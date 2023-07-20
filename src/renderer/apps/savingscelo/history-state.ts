import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import { BlockTransactionString } from 'web3-eth'
import * as React from 'react'

import { Account } from '../../../lib/accounts/accounts'
import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'
import { newSavingsCELOWithUbeKit } from 'savingscelo-with-ube'

interface BaseEvent {
	blockNumber: number
	timestamp: Date
	txHash: string
	type: "Deposit" | "Withdraw" | "Swap"
}

export interface DepositEvent extends BaseEvent {
	type: "Deposit"
	amount_CELO: BigNumber
	amount_sCELO: BigNumber
}

export interface WithdrawEvent extends BaseEvent {
	type: "Withdraw"
	amount_sCELO: BigNumber
	amount_CELO: BigNumber
}

export interface SwapEvent extends BaseEvent {
	type: "Swap"
	amount_CELO: BigNumber
	amount_sCELO: BigNumber
	direction: "buy" | "sell"
}

export type SavingsEvent = DepositEvent | WithdrawEvent | SwapEvent

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useSavingsEventHistoryState = (account: Account, savingsWithUbeAddress: string) => {
	const fetchCallback = React.useCallback(
		async (
			kit: ContractKit,
			fromBlock: number,
			toBlock: number,
			latestBlock: BlockTransactionString): Promise<SavingsEvent[]> => {
			const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
			const token0 = await sKit.pair.methods.token0().call()
			const [deposits, depositsWithUbe, withdraws, swaps] = await Promise.all([
				// from, celoAmount, savingsAmount
				sKit.savingsKit.contract.getPastEvents("Deposited", {
					fromBlock, toBlock, filter: {from: account.address},
				})
				.then((e) => e.map((e) => ({
					type: "Deposit",
					blockNumber: e.blockNumber,
					timestamp: estimateTimestamp(latestBlock, e.blockNumber),
					txHash: e.transactionHash,
					amount_CELO: new BigNumber(e.returnValues.celoAmount),
					amount_sCELO: new BigNumber(e.returnValues.savingsAmount),
				} as DepositEvent))),

				// from, celoAmount, savingsAmount, direct
				sKit.contract.getPastEvents("Deposited", {
					fromBlock, toBlock, filter: {from: account.address},
				})
				.then((e) => e.map((e) => (
					e.returnValues.direct ? {
						type: "Deposit",
						blockNumber: e.blockNumber,
						timestamp: estimateTimestamp(latestBlock, e.blockNumber),
						txHash: e.transactionHash,
						amount_CELO: new BigNumber(e.returnValues.celoAmount),
						amount_sCELO: new BigNumber(e.returnValues.savingsAmount),
					} as DepositEvent
					: {
						type: "Swap",
						direction: "buy",
						blockNumber: e.blockNumber,
						timestamp: estimateTimestamp(latestBlock, e.blockNumber),
						txHash: e.transactionHash,
						amount_CELO: new BigNumber(e.returnValues.celoAmount),
						amount_sCELO: new BigNumber(e.returnValues.savingsAmount),
					} as SwapEvent
				))),

				// from, savingsAmount, celoAmount
				sKit.savingsKit.contract.getPastEvents("WithdrawStarted", {
					fromBlock, toBlock, filter: {from: account.address},
				})
				.then((e) => e.map((e) => ({
					type: "Withdraw",
					blockNumber: e.blockNumber,
					timestamp: estimateTimestamp(latestBlock, e.blockNumber),
					txHash: e.transactionHash,
					amount_sCELO: new BigNumber(e.returnValues.savingsAmount),
					amount_CELO: new BigNumber(e.returnValues.celoAmount),
				} as WithdrawEvent))),

				// sender, amount0In, amount1In, amount0Out, amount1Out, to
				sKit.pair.getPastEvents("Swap", {
					fromBlock, toBlock, filter: {to: account.address},
				})
				.then((e) => e.map((e) => {
					const amount0In = new BigNumber(e.returnValues.amount0In)
					const amount1In = new BigNumber(e.returnValues.amount1In)
					const amount0Out = new BigNumber(e.returnValues.amount0Out)
					const amount1Out = new BigNumber(e.returnValues.amount1Out)
					const direction = (
						(token0 === sKit.savingsKit.contractAddress && !amount0Out.eq(0)) ||
						(token0 !== sKit.savingsKit.contractAddress && !amount1Out.eq(0))) ? "buy" : "sell"
					const amount0 = BigNumber.maximum(amount0In, amount0Out)
					const amount1 = BigNumber.maximum(amount1In, amount1Out)
					const [amount_CELO, amount_sCELO] = token0 !== sKit.savingsKit.contractAddress ?
						[amount0, amount1] : [amount1, amount0]
					return {
						type: "Swap",
						blockNumber: e.blockNumber,
						timestamp: estimateTimestamp(latestBlock, e.blockNumber),
						txHash: e.transactionHash,
						amount_CELO,
						amount_sCELO,
						direction,
					} as SwapEvent
				})),
			])

			const events: SavingsEvent[] = [...deposits, ...depositsWithUbe, ...withdraws, ...swaps]
			events.sort((a, b) => a.blockNumber - b.blockNumber)
			return events
		}, [account, savingsWithUbeAddress],
	)

	return useEventHistoryState(
		fetchCallback, {
			maxHistoryDays: 1,
			maxEvents: 100,
		},
	)
}