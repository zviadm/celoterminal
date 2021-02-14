import { Account } from '../../../lib/accounts'
import useSessionState from '../../state/session-state'
import { decryptLocalKey } from '../../../lib/accountsdb'
import { canDecryptLocalKey } from './wallet'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'
import { UserError } from '../../../lib/error'
import { nowMS } from '../../state/time'

import * as React from 'react'

import UnlockAccount from './unlock-account'
import RunTXs from './run-txs'

const cacheMS = 60 * 60 * 1000

function TXRunner(props: {
	selectedAccount: Account,
	txFunc?: TXFunc,
	onFinish: TXFinishFunc,
}): JSX.Element {
	const [pw, setPW] = useSessionState<{
		password: string,
		expireMS: number,
	} | undefined>("terminal/core/password", undefined)
	let pwValid = false
	if (props.selectedAccount.type === "local") {
		// check password.
		pwValid = (pw ?
			pw && pw.expireMS > nowMS() &&
			canDecryptLocalKey(props.selectedAccount, pw.password) : false)
		if (!pwValid && pw) {
			setPW(undefined)
		}
	}
	const pwNeeded = props.selectedAccount.type === "local" && !pwValid
	const pwOnCancel = () => {
		props.onFinish(new UserError(`Cancelled`), [])
	}
	const pwOnPassword = (p: string) => {
		if (props.selectedAccount.type !== "local") {
			return
		}
		decryptLocalKey(props.selectedAccount.encryptedData, p)
		setPW({password: p, expireMS: nowMS() + cacheMS})
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
export default TXRunner