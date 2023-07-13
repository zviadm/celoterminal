import { ContractKit } from '@celo/contractkit'
import { Address, CeloTransactionObject, CeloTx, CeloTxReceipt, EncodedTransaction } from '@celo/connect'

import { Account } from '../../lib/accounts/accounts'

export interface Transaction {
	// TODO(zviadm): Transaction type is the "default"/undefined. This is to avoid making
	// massive code changes to all the apps. In future this can be more explicitly set to
	// `type: "transaction"`.
	type?: undefined
	tx: CeloTransactionObject<unknown> | "eth_signTransaction" | "eth_sendTransaction"
	params?: CeloTx,
}

export interface SignPersonal {
	type: "signPersonal"
	params: {
		from: Address
		data: string
	}
}

export interface SignTypedDataV4 {
	type: "signTypedData_v4"
	params: {
		from: Address
		data: string
	}
}


export type SignatureRequest = (Transaction | SignPersonal | SignTypedDataV4) & {
	// This flag is useful for contract/indirect account types. This
	// flag signals that request should be executed using the parent/owner account
	// as it is coming from the parent account itself.
	executeUsingParentAccount?: boolean,
}

export interface ResponseSendTX {
	type: "eth_sendTransaction"
	receipt: CeloTxReceipt,
}

export interface ResponseSignTX {
	type: "eth_signTransaction"
	encodedTX: EncodedTransaction,
}

export interface ResponseSignPersonal {
	type: "eth_signPersonal"
	encodedData: string
}

export interface ResponseSignTypedDataV4 {
	type: "eth_signTypedData_v4"
	encodedData: string
}

export type SignatureResponse = ResponseSendTX | ResponseSignTX | ResponseSignPersonal | ResponseSignTypedDataV4

// All transaction running goes through central TXRunner system that has
// access to accounts and their transaction signing methods.
// Apps can ask TXRunner to run transactions by utlizing runTXs call, and
// by supplying a TXFunc callback that prepares transactions to run. Once
// TXRunner completes (or errors out), supplied onFinish call back will be called.
export type TXFunc = (kit: ContractKit) => Promise<SignatureRequest[]>
export type TXFinishFunc = (e?: Error, r?: SignatureResponse[]) => void

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
