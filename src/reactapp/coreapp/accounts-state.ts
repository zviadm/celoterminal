import * as React from 'react'

import useLocalStorageState from '../state/localstorage-state'
import { Account } from '../accountsdb/accounts'
import { accountsDB } from '../accountsdb/accountsdb'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useAccounts = () => {
	const [accounts, setAccounts] = React.useState<Account[] | undefined>()
	const [_selectedAccount, setSelectedAccount] =
		useLocalStorageState<Account | undefined>("terminal/core/selected-account", undefined)
	const refreshAccounts = () => {
		const accounts = accountsDB().readAccounts()
		accounts.sort((a, b) => {
			const rankA = accountRank(a)
			const rankB = accountRank(b)
			for (let i = 0; i < rankA.length; i += 1) {
				if (rankA[i] < rankB[i]) {
					return -1
				} else if (rankA[i] > rankB[i]) {
					return 1
				}
			}
			return 0
		})
		setAccounts(accounts)
	}
	React.useEffect(() => { refreshAccounts() }, [])
	const addAccount = (a?: Account, password?: string) => {
		if (a) {
			accountsDB().addAccount(a, password)
		}
		refreshAccounts()
	}
	const removeAccount = (a: Account) => {
		accountsDB().removeAccount(a)
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
		removeAccount,
		setSelectedAccount,
	}
}

const accountRank = (a: Account) => {
	const typeRank = (
		a.type === "ledger" ? 0 :
		a.type === "local" ? 1 : 2)
	return [typeRank, a.name]
}