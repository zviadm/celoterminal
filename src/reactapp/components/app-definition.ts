import BN from 'bn.js'
import { ContractKit } from '@celo/contractkit'
import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'

import { Account } from '../state/accounts'

export interface Transaction {
	tx: CeloTransactionObject<unknown>
	value?: string | number | BN
}

export type TXFunc = (kit: ContractKit) => Promise<Transaction[]>
export type TXFinishFunc = (e?: Error, r?: CeloTxReceipt[]) => void

export interface AppDefinition {
	name: string
	renderApp: (props: {
		accounts: Account[],
		selectedAccount: Account,
		onError: (e: Error) => void,
		runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
	}) => JSX.Element
}