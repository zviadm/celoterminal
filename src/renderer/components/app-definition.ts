import BN from 'bn.js'
import { ContractKit } from '@celo/contractkit'
import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'

import { Account } from '../../lib/accounts'

export interface Transaction {
	tx: CeloTransactionObject<unknown>
	value?: string | number | BN
}

export type TXFunc = (kit: ContractKit) => Promise<Transaction[]>
export type TXFinishFunc = (e?: Error, r?: CeloTxReceipt[]) => void

export interface AppDefinition {
	id: string
	title: string
	icon: <T>(props: T) => JSX.Element
	core?: boolean
	url?: string
	description?: string

	renderApp: (props: {
		accounts: Account[],
		selectedAccount: Account,
		runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
	}) => JSX.Element
}
