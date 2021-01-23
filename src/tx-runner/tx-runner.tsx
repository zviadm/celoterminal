import * as React from 'react'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { CeloTransactionObject } from '@celo/connect'
import BN from 'bn.js'

import kit from './kit'

export interface Transaction<T> {
	tx: CeloTransactionObject<T>
	value: string | number | BN
}

export type TXFunc = <T>(kit: ContractKit) => Promise<Transaction<T>[]>

const TXRunner = (props: {
	selectedAccount: Account,
	txFunc?: TXFunc,
	onFinish: () => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const [isRunning, setIsRunning] = React.useState(false)
	const txFunc = props.txFunc
	const onFinish = props.onFinish
	const onError = props.onError
	React.useEffect(() => {
		if (!isRunning && txFunc) {
			setIsRunning(true);
			(async () => {
				try {
					const _k = kit()
					// const w = new Wallet()
					const kitWithAcct = newKitFromWeb3(_k.web3) //, w)
					const txs = await txFunc(kitWithAcct)
					for (const tx of txs) {
						await tx.tx.sendAndWaitForReceipt({value: tx.value})
					}
				} catch (e) {
					onError(e)
				} finally {
					setIsRunning(false)
					onFinish()
				}
			})
		}
	}, [isRunning, txFunc, onFinish, onError])
	return (
		<div></div>
	)
}
export default TXRunner
