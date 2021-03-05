import electron from 'electron'
import * as path from 'path'
import * as log from 'electron-log'
import { privateKeyToAddress } from '@celo/utils/lib/address'

import AccountsDB, { encryptLocalKey } from '../lib/accounts/accountsdb'
import { CFG } from '../lib/cfg'
import { SpectronAccountKeys, SpectronAccountsDBPassword } from '../lib/spectron-utils/constants'

export const testOnlySetupAccountsDB = (): void => {
	const cfg = CFG()
	const dbPath = path.join(
		electron.app.getPath(cfg.accountsDBPath.root), ...cfg.accountsDBPath.path)
	const db = new AccountsDB(dbPath)
	const accounts = db.readAccounts()

	const testAcctIdxs = [0, 1, 2]
	const testAccts = testAcctIdxs.map((idx) => ({
		name: `Test/A${idx}`,
		privateKey: SpectronAccountKeys[idx],
		address: privateKeyToAddress(SpectronAccountKeys[idx]),
	}))
	// TODO(zviad): This might require some cleanup/rethinking for perf/reuse.

	const toRemove = accounts.filter((a) =>
		!testAccts.find((ta) => ta.name === a.name && ta.address === a.address))
	log.info(`accountsDB: removing ${toRemove.length} accounts...`)
	for (const account of toRemove) {
		db.removeAccount(account)
	}
	for (const account of testAccts) {
		const exists = accounts.find((a) => a.name === account.name && a.address === account.address)
		if (exists) {
			continue
		}
		log.info(`accountsDB: adding ${account.name}...`)
		db.addAccount({
			type: "local",
			name: account.name,
			address: account.address,
			encryptedData: encryptLocalKey({privateKey: account.privateKey}, SpectronAccountsDBPassword),
		}, SpectronAccountsDBPassword)
	}
	db.close()
	return
}
