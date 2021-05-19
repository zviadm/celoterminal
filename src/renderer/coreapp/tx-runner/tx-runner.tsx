import { Account } from '../../../lib/accounts/accounts'
import useSessionState from '../../state/session-state'
import { decryptLocalKey } from '../../../lib/accounts/accountsdb'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'
import { nowMS } from '../../state/time'
import { transformError } from '../ledger-utils'
import { createWallet, rootAccount, Wallet } from './wallet'

import * as React from 'react'

import UnlockAccount from './unlock-account'
import RunTXs, { TXCancelled } from './run-txs'

const cacheMS = 60 * 60 * 1000

function TXRunner(props: {
	selectedAccount: Account,
	accounts: Account[],
	txFunc: TXFunc,
	onFinish: TXFinishFunc,
}): JSX.Element {
	const [pw, setPW] = useSessionState<{
		password: string,
		expireMS: number,
	} | undefined>("terminal/core/password", undefined)
	const [wallet, setWallet] = React.useState<
		"create-wallet" |
		"unlock-wallet" |
		Wallet>("create-wallet")

	const selectedAccount = props.selectedAccount
	const accounts = props.accounts
	const executingAccount = rootAccount(selectedAccount, accounts)

	const firstErr = React.useRef(true)
	React.useEffect(() => {
		if (wallet !== "create-wallet") {
			return
		}
		if (
			executingAccount.type === "local" &&
			pw && pw.expireMS < nowMS()
			) {
			// if password is expired, reset it.
			setPW(undefined)
			setWallet("unlock-wallet")
			return
		}
		let cancelled = false
		;(async () => {
			const w = await createWallet(selectedAccount, accounts, pw?.password)
			if (cancelled) { return }
			setWallet(w)
		})()
		.catch((e) => {
			setWallet("unlock-wallet")
			if (firstErr.current) {
				firstErr.current = false
			} else {
				throw transformError(e)
			}
		})
		return () => { cancelled = true }
	}, [wallet, selectedAccount, accounts, executingAccount, pw, setPW])

	const handleCancel = () => {
		props.onFinish(new TXCancelled())
	}
	const handleUnlock = (p: string) => {
		if (executingAccount.type === "local") {
			decryptLocalKey(executingAccount.encryptedData, p)
			setPW({password: p, expireMS: nowMS() + cacheMS})
		}
		setWallet("create-wallet")
	}

	switch (wallet) {
	case "create-wallet":
	case "unlock-wallet":
		return <UnlockAccount
			account={executingAccount}
			unlocking={wallet === "create-wallet"}
			onCancel={handleCancel}
			onUnlock={handleUnlock}
		/>
	default:
		return <RunTXs
			selectedAccount={props.selectedAccount}
			accounts={props.accounts}
			wallet={wallet}
			txFunc={props.txFunc}
			onFinish={props.onFinish}
		/>
	}
}
export default TXRunner