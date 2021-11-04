import { ContractKit } from '@celo/contractkit'
import { CeloTransactionObject, CeloTx, CeloTxReceipt, EncodedTransaction } from '@celo/connect'

import { Account } from '../../lib/accounts/accounts'

export interface Transaction {
	tx: CeloTransactionObject<unknown> | "eth_signTransaction" | "eth_sendTransaction"
	params?: CeloTx,

	// This flag is useful for contract/indirect account types. This
	// flag signals that transaction should be executed using the parent/owner account
	// as it is coming from the parent account itself.
	executeUsingParentAccount?: boolean,
}

// All transaction running goes through central TXRunner system that has
// access to accounts and their transaction signing methods.
// Apps can ask TXRunner to run transactions by utlizing runTXs call, and
// by supplying a TXFunc callback that prepares transactions to run. Once
// TXRunner completes (or errors out), supplied onFinish call back will be called.
export type TXFunc = (kit: ContractKit) => Promise<Transaction[]>
export type TXFinishFunc = (
	e?: Error, receipts?: CeloTxReceipt[], signedTXs?: EncodedTransaction[]) => void

export interface AppDefinition {
	// ID should match the app directory name. It is best to avoid changing the ID
	// once app is launched.
	id: string
	core?: boolean // core==True only for core Celo apps that are always enabled/visible.
	title: string
	icon: JSX.Element      // 24px x 24px in size
	iconLarge: JSX.Element // 35px x 35px in size
	url?: string
	description?: string

	renderApp: (props: {
		accounts: Account[],
		selectedAccount: Account,
		runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
	}) => JSX.Element

	// notifyCount function gets called periodically by the core app framework.
	// Apps that do any kind of background fetching can return notification count
	// that will be displayed as a badge counter in the app-menu.
	// This function mustn't do any calculations internally and must return immediatelly.
	notifyCount?: () => number,
}
