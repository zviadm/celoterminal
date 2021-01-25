import * as React from 'react'
import { ipcRenderer } from 'electron'
import { ContractKit } from '@celo/contractkit'
import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import BN from 'bn.js'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'

import kit from './kit'
import { Account } from '../../common/accounts'
import { channelRunTXs, RunTXsReq, RunTXsResp } from '../../common/ipc'

export interface Transaction {
	tx: CeloTransactionObject<unknown>
	value: string | number | BN
}

export type TXFunc = (kit: ContractKit) => Promise<Transaction[]>
export type TXFinishFunc = (e: Error | null, r: CeloTxReceipt[]) => void

function TXRunner(props: {
	selectedAccount: Account,
	txFunc?: TXFunc,
	onFinish: TXFinishFunc,
}): JSX.Element {
	const [isRunning, setIsRunning] = React.useState(false)
	const txFunc = props.txFunc
	const onFinish = props.onFinish
	const selectedAccount = props.selectedAccount
	React.useEffect(() => {
		if (isRunning || !txFunc) {
			return
		}
		setIsRunning(true);
		// NOTE: This should be impossible to cancel now from outside.
		(async () => {
			try {
				const _k = kit()
				const txs = await txFunc(_k)
				const r: RunTXsResp = await ipcRenderer.invoke(
					channelRunTXs, {
						selectedAccount: selectedAccount,
						// txs: txs,
					} as RunTXsReq)
				onFinish(null, r)
			} catch (e) {
				onFinish(e, [])
			} finally {
				setIsRunning(false)
			}
		})()
	}, [isRunning, txFunc, onFinish, selectedAccount])
	return (
		<Dialog
			open={isRunning}
			onClose={() => {
				return
			}}
			maxWidth="xs"
		>
			<DialogTitle>TXRunner</DialogTitle>
			<DialogContent>
				Running...
			</DialogContent>
		</Dialog>
	)
}
export default TXRunner
