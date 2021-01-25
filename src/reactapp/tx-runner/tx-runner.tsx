import * as React from 'react'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { CeloTransactionObject, CeloTxReceipt , ReadOnlyWallet } from '@celo/connect'
import BN from 'bn.js'
import TransportNodeHidNoEvents from '@ledgerhq/hw-transport-node-hid-noevents'
import { AddressValidation, newLedgerWalletWithSetup } from '@celo/wallet-ledger'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'

import kit from './kit'
import { Account } from '../../common/accounts'
import { CFG } from '../..//common/cfg'

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
				const networkId = await _k.web3.eth.net.getId()
				if (networkId !== CFG.networkId) {
					throw new Error(`NetworkId mismatch! Expected: ${CFG.networkId}, Got: ${networkId}. Refusing to run transactions!`)
				}
				const w = await createWallet(selectedAccount)
				try {
					const kitWithAcct = newKitFromWeb3(_k.web3, w.wallet)
					kitWithAcct.defaultAccount = selectedAccount.address
					const txs = await txFunc(kitWithAcct)
					for (const tx of txs) {
						await tx.tx.sendAndWaitForReceipt({
							from: selectedAccount.address,
							value: tx.value,
						})
					}
					onFinish(null, [])
				} finally {
					if (w.transport) {
						await w.transport.close()
					}
				}
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

export async function createWallet(a: Account): Promise<{
	wallet: ReadOnlyWallet
	transport?: {close: () => void}
}> {
	switch (a.type) {
		// case "local": {
		// 	const w = new LocalWallet()
		// 	return w
		// }
		case "ledger": {
			const _transport = await TransportNodeHidNoEvents.open()
			console.info(`transport created`, _transport)
			try {
				const wallet = await newLedgerWalletWithSetup(
					_transport,
					[a.derivationPathIndex],
					a.baseDerivationPath,
					AddressValidation.never)
				return {wallet, transport: _transport}
			} catch (e) {
				_transport.close()
				throw e
			}
		}
		default:
			throw new Error(`Account type: '${a.type}' can not sign transactions!`)
	}
}

export default TXRunner
