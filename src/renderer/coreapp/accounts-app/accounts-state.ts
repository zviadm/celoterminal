import * as React from 'react'
import electron from 'electron'
import path from 'path'

import useLocalStorageState from '../../state/localstorage-state'
import { Account } from '../../../lib/accounts/accounts'
import AccountsDB from '../../../lib/accounts/accountsdb'
import { CFG } from './../../../lib/cfg'

let _db: AccountsDB

const accountsDB = (): AccountsDB => {
	if (!_db) {
		const cfg = CFG()
		const dbPath = path.join(
			electron.remote.app.getPath(cfg.accountsDBPath.root), ...cfg.accountsDBPath.path)
		try {
			_db = new AccountsDB(dbPath)
		} catch (e) {
			electron.remote.dialog.showMessageBoxSync({
				type: "error",
				title: "CRASH",
				message:
					`Accounts database: ${dbPath} can not be created or opened.\n` +
					`CeloTerminal can not start.\n\n${e}`,
			})
			electron.remote.app.quit()
			throw e
		}
		window.addEventListener('unload', () => { _db.close() })
	}
	return _db
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useAccounts = () => {
	const [_accounts, setAccounts] = React.useState<Account[] | undefined>()
	const [_selectedAccount, setSelectedAccount] =
		useLocalStorageState<Account | undefined>("terminal/core/selected-account", undefined)
	const [_hasPassword, setHasPassword] = React.useState(false)
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
		const hasPassword = _hasPassword || accountsDB().hasPassword()
		if (hasPassword !== _hasPassword) {
			setHasPassword(hasPassword)
		}
		setAccounts(accounts)
		return {accounts, hasPassword}
	}
	// _accounts will be undefined only once. Load accounts synchronously since
	// all database access is synchronous anyways.
	let accounts = _accounts
	let hasPassword = _hasPassword
	if (!accounts) {
		const initial = refreshAccounts()
		accounts = initial.accounts
		hasPassword = initial.hasPassword
	}
	const addAccount = (a?: Account, password?: string, update?: boolean) => {
		if (a) {
			accountsDB().addAccount(a, password, update)
		}
		refreshAccounts()
	}
	const removeAccount = (a: Account) => {
		accountsDB().removeAccount(a)
		refreshAccounts()
	}
	const renameAccount = (a: Account, name: string) => {
		accountsDB().renameAccount(a, name)
		refreshAccounts()
	}
	const changePassword = (oldPassword: string, newPassword: string) => {
		accountsDB().changePassword(oldPassword, newPassword)
		refreshAccounts()
	}
	const selectedAccount =
		!accounts ? _selectedAccount :
		accounts.length === 0 ? undefined :
		accounts.find((a) => a.address === _selectedAccount?.address) || accounts[0]
	if (selectedAccount && selectedAccount !== _selectedAccount) {
		setSelectedAccount(selectedAccount)
	}
	return {
		accounts,
		selectedAccount,
		hasPassword,
		addAccount,
		removeAccount,
		renameAccount,
		changePassword,
		setSelectedAccount,
	}
}

export const accountsDBFilePath = (): string => {
	return accountsDB().dbPath
}

const accountRank = (a: Account) => {
	const typeRank = (
		a.type === "ledger" ? 0 :
		a.type === "local" ? 1 :
		a.type === "multisig" ? 2: 3)
	return [typeRank, a.name]
}