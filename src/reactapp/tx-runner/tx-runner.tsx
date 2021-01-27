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
import useGlobalState from '../state/global-state'
import { decryptLocalKey } from '../accountsdb/accountsdb'
import { DialogActions } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'

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
	onError: (e: Error) => void,
}): JSX.Element {
	const [pw, setPW] = useGlobalState<{
		password: string,
		expireMS: number,
	} | undefined>("terminal/core/password", undefined)
	let pwValid = false
	if (props.selectedAccount.type === "local") {
		// check password.
		if (pw && pw.expireMS > Date.now()) {
			try {
				decryptLocalKey(props.selectedAccount, pw.password)
				pwValid = true
			} catch (e) {
				console.warn(`TX: cached password is no longer valid?`)
			}
		}
		if (!pwValid && pw) {
			setPW(undefined)
		}
	}
	const pwNeeded = props.selectedAccount.type === "local" && !pwValid
	const pwOnCancel = () => {
		props.onFinish(new Error(`Cancelled`), [])
	}
	const pwOnPassword = (p: string) => {
			if (props.selectedAccount.type !== "local") {
				return
			}
			try {
				decryptLocalKey(props.selectedAccount, p)
				setPW({password: p, expireMS: Date.now() + 5 * 60 * 1000})
			} catch (e) {
				props.onError(e)
			}
	}
	return (<>{props.txFunc && (
		pwNeeded ?
		<UnlockAccount
			onCancel={pwOnCancel}
			onPassword={pwOnPassword}
		/> :
		<RunTXs
			selectedAccount={props.selectedAccount}
			password={pw?.password}
			txFunc={props.txFunc}
			onFinish={props.onFinish}
		/>
	)}</>)
}

const UnlockAccount = (props: {
	onPassword: (p: string) => void,
	onCancel: () => void,
}) => {
	const [password, setPassword] = React.useState("")
	const handleUnlock = () => {
		props.onPassword(password)
	}
	return (
		<Dialog open={true}>
			<DialogTitle>Unlock account</DialogTitle>
			<DialogContent>
				<Alert severity="info">
					Password is required to unlock your local account.
				</Alert>
				<TextField
						margin="dense"
						type="password"
						label={`Password`}
						variant="outlined"
						value={password}
						size="medium"
						fullWidth={true}
						onChange={(e) => { setPassword(e.target.value) }}
					/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleUnlock}>Unlock</Button>
			</DialogActions>
		</Dialog>
	)
}

const RunTXs = (props: {
	selectedAccount: Account,
	password?: string,
	txFunc: TXFunc,
	onFinish: TXFinishFunc,
}) => {
	const [isRunning, setIsRunning] = React.useState(false)
	const txFunc = props.txFunc
	const onFinish = props.onFinish
	const selectedAccount = props.selectedAccount
	const password = props.password
	React.useEffect(() => {
		if (isRunning) {
			return
		}
		setIsRunning(true);
		// NOTE: This should be impossible to cancel now from outside.
		(async () => {
			try {
				const w = await createWallet(selectedAccount, password)
				const accounts = w.wallet.getAccounts()
				if (accounts.length !== 1 ||
					accounts[0].toLowerCase() !== selectedAccount.address.toLowerCase()) {
					throw new Error(
						`Unexpected Account. Expected: ${selectedAccount.address}, Got: ${accounts[0]}. ` +
						`Refusing to run transactions.`)
				}
				const kit = newKit(CFG.networkURL, w.wallet)
				kit.defaultAccount = selectedAccount.address
				try {
					const networkId = await kit.web3.eth.net.getId()
					if (networkId !== CFG.networkId) {
						throw new Error(
							`Unexpected NetworkId. Expected: ${CFG.networkId}, Got: ${networkId}. ` +
							`Refusing to run transactions.`)
					}
					const txs = await txFunc(kit)
					const r: CeloTxReceipt[] = []
					for (const tx of txs) {
						console.info(`TX: args`, tx.tx.txo._parent.options.address, tx.tx.txo.arguments)
						const result = await tx.tx.send({value: tx.value})
						const txHash = await result.getHash()
						console.info(`TX: sent`, txHash)
						const receipt = await result.waitReceipt()
						console.info(`TX: receipt`, receipt)
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
	}, [isRunning, txFunc, onFinish, selectedAccount, password])
	return (
		<Dialog open={true}>
			<DialogTitle>Sign Transactions</DialogTitle>
			<DialogContent>
				Running...
			</DialogContent>
		</Dialog>
	)
}

export async function createWallet(a: Account, password?: string): Promise<{
	wallet: ReadOnlyWallet
	transport?: {close: () => void}
}> {
	switch (a.type) {
		case "local": {
			if (!password) {
				throw new Error("Password must be entered to unlock local accounts.")
			}
			const wallet = new LocalWallet()
			const localKey = decryptLocalKey(a, password)
			wallet.addAccount(localKey.privateKey)
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
			throw new Error(`Read-only accounts can not sign transactions.`)
	}
}

export default TXRunner
