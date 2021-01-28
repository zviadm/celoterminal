import BN from 'bn.js'
import { ContractKit } from '@celo/contractkit'
import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'

export interface Transaction {
	tx: CeloTransactionObject<unknown>
	value?: string | number | BN
}

export type TXFunc = (kit: ContractKit) => Promise<Transaction[]>
export type TXFinishFunc = (e: Error | null, r: CeloTxReceipt[]) => void
