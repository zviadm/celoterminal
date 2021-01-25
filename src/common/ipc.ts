import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import BN from 'bn.js'

import { Account } from './accounts'

export const channelRunTXs = "terminal/core/run-txs"

export interface RunTXsReq {
	selectedAccount: Account
	txs: Transaction[]
}

export type RunTXsResp = CeloTxReceipt[]

export interface Transaction {
	tx: CeloTransactionObject<unknown>
	value: string | number | BN
}
