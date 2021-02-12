import electron from 'electron'
import * as path from 'path'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { ACCOUNT_PRIVATE_KEYS } from 'celo-devchain'

import AccountsDB, { encryptLocalKey } from '../lib/accountsdb'
import { CFG } from '../lib/cfg'
import { SpectronAccountsDBPassword } from '../lib/spectron-utils/constants'

export const testOnlySetupAccountsDB = (): void => {
	const cfg = CFG()
	const dbPath = path.join(
		electron.app.getPath(cfg.accountsDBPath.root), ...cfg.accountsDBPath.path)
	const db = new AccountsDB(dbPath)
	const accounts = db.readAccounts()
	// TODO(zviad): This might require some cleanup/rethinking for perf/reuse.
	const a0pkey = ACCOUNT_PRIVATE_KEYS[0]
	const a0addr = privateKeyToAddress(a0pkey)
	let foundA0 = false
	for (const account of accounts) {
		if (account.address === a0addr) {
			foundA0 = true
		} else {
			db.removeAccount(account)
		}
	}
	if (!foundA0) {
		db.addAccount({
			type: "local",
			name: "a0",
			address: a0addr,
			encryptedData: encryptLocalKey({privateKey: a0pkey}, SpectronAccountsDBPassword),
		}, SpectronAccountsDBPassword)
	}
	db.close()
	return
}
