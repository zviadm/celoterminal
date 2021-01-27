import * as React from 'react'

import useLocalStorageState from './localstorage-state'
import { Account } from '../accountsdb/accounts'
import { accountsDB } from '../accountsdb/accountsdb'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useAccounts = () => {
	const [accounts, setAccounts] = React.useState<Account[] | undefined>()
	const [_selectedAccount, setSelectedAccount] =
		useLocalStorageState<Account | undefined>("terminal/core/selected-account", undefined)
	const refreshAccounts = () => {
		const accounts = accountsDB().readAccounts()
		setAccounts(accounts)
	}
	React.useEffect(() => {
		refreshAccounts()
	}, [])
	const addAccount = (a?: Account, password?: string) => {
		if (a) {
			accountsDB().addAccount(a, password)
		}
		refreshAccounts()
	}
	const selectedAccount =
		!accounts ? _selectedAccount :
		accounts.length === 0 ? undefined :
		accounts.find((a) => a.address === _selectedAccount?.address) || accounts[0]
	return {
		accounts,
		selectedAccount,
		addAccount,
		setSelectedAccount,
	}
}
