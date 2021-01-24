import * as React from 'react'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import BN from 'bn.js'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'

import kit from './kit'
import { Account } from '../state/accounts-state'

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
	React.useEffect(() => {
		if (isRunning || !txFunc) {
			return
		}
		setIsRunning(true);
		// NOTE: This should be impossible to cancel now from outside.
		(async () => {
			try {
				const _k = kit()
				// const w = new Wallet()
				const kitWithAcct = newKitFromWeb3(_k.web3) //, w)
				console.info(`kitwithacct`, kitWithAcct)
				const txs = await txFunc(kitWithAcct)
				console.info(`txs`, txs)
				const r: CeloTxReceipt[] = []
				for (const tx of txs) {
					const result = await tx.tx.sendAndWaitForReceipt({value: tx.value})
					r.push(result)
				}
				onFinish(null, r)
			} catch (e) {
				onFinish(e, [])
			} finally {
				setIsRunning(false)
			}
		})()
	}, [isRunning, txFunc, onFinish])
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
