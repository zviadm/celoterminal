import * as React from 'react'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { CeloTransactionObject } from '@celo/connect'
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

function TXRunner(props: {
	selectedAccount: Account,
	txFunc?: TXFunc,
	onFinish: () => void,
	onError: (e: Error) => void,
}): JSX.Element {
	const [isRunning, setIsRunning] = React.useState(false)
	const txFunc = props.txFunc
	const onFinish = props.onFinish
	const onError = props.onError
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
				for (const tx of txs) {
					await tx.tx.sendAndWaitForReceipt({value: tx.value})
				}
			} catch (e) {
				onError(e)
			} finally {
				onFinish()
				setIsRunning(false)
			}
		})()
	}, [isRunning, txFunc, onFinish, onError])
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
