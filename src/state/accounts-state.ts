import * as React from 'react'

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
	const [selectedAccount, setSelectedAccount] = React.useState<Account | undefined>()
	React.useEffect(() => {
		// TODO: load from a database instead.
		const accts: Account[] = [{
				type: "local",
				name: "local1",
				address: "0x0001",
			}, {
				type: "ledger",
				name: "ledger1",
				address: "0x0002",
				baseDerivationPath: celoBaseDerivationPath,
				derivationPathIndex: 0,
			}
		]
		setAccounts(accts)
		setSelectedAccount(accts[1])
	}, [])
	return {
		accounts,
		selectedAccount,
		setAccounts,
		setSelectedAccount,
	}
}
