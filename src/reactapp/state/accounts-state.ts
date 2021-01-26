import * as React from 'react'

import { CELO_BASE_DERIVATION_PATH } from '@celo/wallet-ledger'

import useLocalStorageState from './localstorage-state'
import { Account } from '../accountsdb/accounts'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useAccounts = () => {
	const [accounts, setAccounts] = React.useState<Account[] | undefined>()
	const [selectedAccount, setSelectedAccount] =
		useLocalStorageState<Account | undefined>("terminal/core/selected-account", undefined)
	React.useEffect(() => {
		// TODO: load from a database instead.
		const accts: Account[] = [{
				type: "address-only",
				name: "RGGroup",
				address: "0x7C75B0B81A54359E9dCCDa9cb663ca2e3De6B710",
			}, {
				type: "ledger",
				name: "Ledger0",
				address: "0x4d82BfC8823a4F3AF82B0AdE52ff3e2d74A04757",
				baseDerivationPath: CELO_BASE_DERIVATION_PATH,
				derivationPathIndex: 0,
			}, {
				type: "local",
				name: "Local0",
				address: "0x9d1C3a6b2478EF3f15E025101dC34aBE1F847eC8",
			}
		]
		setAccounts(accts)
		const selected = (accts.find((a) => a.address === selectedAccount?.address)) || accts[0]
		setSelectedAccount(selected)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	return {
		accounts,
		selectedAccount,
		setAccounts,
		setSelectedAccount,
	}
}
