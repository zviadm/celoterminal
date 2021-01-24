import * as React from 'react'
import useLocalStorageState from './localstorage-state'

const celoBaseDerivationPath = "44'/52752'/0'/0/"

export interface BaseAccount {
	type: "address_only" | "local" | "ledger"
	name: string
	address: string
}

export interface LedgerAccount extends BaseAccount {
	type: "ledger"
	baseDerivationPath: string
	derivationPathIndex: number
}

export type Account = BaseAccount | LedgerAccount

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useAccounts = () => {
	const [accounts, setAccounts] = React.useState<Account[] | undefined>()
	const [selectedAccount, setSelectedAccount] =
		useLocalStorageState<Account | undefined>("terminal/core/selected-account", undefined)
	React.useEffect(() => {
		// TODO: load from a database instead.
		const accts: Account[] = [{
				type: "address_only",
				name: "RGGroup",
				address: "0x7C75B0B81A54359E9dCCDa9cb663ca2e3De6B710",
			}, {
				type: "ledger",
				name: "Ledger0",
				address: "0x4d82BfC8823a4F3AF82B0AdE52ff3e2d74A04757",
				baseDerivationPath: celoBaseDerivationPath,
				derivationPathIndex: 0,
			}
		]
		setAccounts(accts)
	}, [])
	React.useEffect(() => {
		if (!accounts || accounts.length === 0) {
			setSelectedAccount(undefined)
			return
		}
		const selected = (accounts.find((a) => a.address === selectedAccount?.address)) || accounts[0]
		setSelectedAccount(selected)
	}, [accounts, selectedAccount, setSelectedAccount])
	return {
		accounts,
		selectedAccount,
		setAccounts,
		setSelectedAccount,
	}
}
