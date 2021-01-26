import * as React from 'react'
import BN from 'bn.js'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import { ContractKit, newKit } from '@celo/contractkit'
import { CeloTransactionObject, CeloTxReceipt , ReadOnlyWallet } from '@celo/connect'
import { AddressValidation, newLedgerWalletWithSetup } from '@celo/wallet-ledger'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'

import { Account } from '../accountsdb/accounts'
import { CFG } from '../../common/cfg'
import { LocalWallet } from '@celo/wallet-local'
import { readAccountData } from '../accountsdb/accountsdb'

export interface Transaction {
	tx: CeloTransactionObject<unknown>
	value?: string | number | BN
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
				const w = await createWallet(selectedAccount)
				const accounts = w.wallet.getAccounts()
				if (accounts.length !== 1 ||
					accounts[0].toLowerCase() !== selectedAccount.address.toLowerCase()) {
					throw new Error(
						`Unexpected Account! Expected: ${selectedAccount.address}, Got: ${accounts[0]}. ` +
						`Refusing to run transactions!`)
				}
				const kit = newKit(CFG.networkURL, w.wallet)
				kit.defaultAccount = selectedAccount.address
				try {
					const networkId = await kit.web3.eth.net.getId()
					if (networkId !== CFG.networkId) {
						throw new Error(
							`Unexpected NetworkId! Expected: ${CFG.networkId}, Got: ${networkId}. ` +
							`Refusing to run transactions!`)
					}
					const txs = await txFunc(kit)
					const r: CeloTxReceipt[] = []
					for (const tx of txs) {
						console.info(`TX args: `, tx.tx.txo._parent.options.address, tx.tx.txo.arguments)
						const result = await tx.tx.send({value: tx.value})
						const txHash = await result.getHash()
						console.info(`TX sent: `, txHash)
						const receipt = await result.waitReceipt()
						console.info(`TX receipt: `, receipt)
						r.push(receipt)
					}
					onFinish(null, r)
				} finally {
					kit.stop()
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
		case "local": {
			const wallet = new LocalWallet()
			// TODO(zviad): Load private key from local storage and decrypt it with a PIN.
			const accountData = readAccountData(a.address)
			if (!accountData) {
				throw new Error(`Account: ${a.address} not found in the database!`)
			}
			// TODO(zviad): need to decode encrypted data first.
			wallet.addAccount(accountData.encryptedData)
			return {wallet}
		}
		case "ledger": {
			const _transport = await TransportNodeHid.open()
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
