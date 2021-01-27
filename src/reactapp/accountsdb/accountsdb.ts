import sqlite3 from 'better-sqlite3'
import electron from 'electron'
import fs from 'fs'
import path from 'path'
import { ensureLeading0x } from '@celo/utils/lib/address'
import { isValidAddress } from 'ethereumjs-util'

import { Account } from './accounts'

// Supported `account` row versions. Last version is the current version.
const supportedVersions = [1]
const currentVersion = supportedVersions[supportedVersions.length - 1]

let _db: AccountsDB

export const accountsDB = (): AccountsDB => {
	if (!_db) {
		_db = new AccountsDB()
	}
	return _db
}

class AccountsDB {
	private db
	constructor() {
		const dbdir = path.join(electron.remote.app.getPath("home"), ".celoterminal")
		fs.mkdirSync(dbdir, {recursive: true})
		const dbpath = path.join(dbdir, "celoaccounts-v0.db")
		console.info(`DB: opening database`, dbpath)
		this.db = new sqlite3(dbpath, {fileMustExist: false, readonly: false})
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS accounts (
				address TEXT PRIMARY KEY,
				version NUMBER,
				type TEXT,
				name TEXT,
				data TEXT,
				encrypted_data TEXT
			) WITHOUT ROWID;`)
	}

	public close = () => {
		console.info(`DB: closing database`)
		this.db.close()
	}

	public readAccounts = (): Account[] => {
		const rows = this.db.prepare(`SELECT * FROM accounts`).all()
		const accounts = rows.filter((r) => supportedVersions.indexOf(r.version) >= 0).map((r) => {
			const base = {
				type: r.type,
				name: r.name,
				address: r.address,
			}
			switch (r.type) {
			case "address-only":
				return base
			case "ledger": {
				const ledgerData = JSON.parse(r.data)
				return {
					...base,
					baseDerivationPath: ledgerData.baseDerivationPath,
					derivationPathIndex: ledgerData.derivationPathIndex,
				}
			}
			case "local":
				return {
					...base,
					encryptedData: r.encrypted_data,
				}
			default:
				throw new Error(`Unrecognized account type: ${r.type}!`)
			}
		})
		return accounts
	}

	public addAccount = (a: Account): void => {
		let data: string
		let encryptedData: string
		switch (a.type) {
		case "local":
			data = ""
			encryptedData = a.encryptedData
			break
		case "address-only":
			data = ""
			encryptedData = ""
			break
		case "ledger":
			data = JSON.stringify({
				baseDerivationPath: a.baseDerivationPath,
				derivationPathIndex: a.derivationPathIndex,
			})
			encryptedData = ""
			break
		default:
			throw new Error(`Unsupported type!`)
		}

		if (!isValidAddress(a.address)) {
			throw new Error(`Invalid address: ${a.address}!`)
		}
		const address = ensureLeading0x(a.address).toLowerCase()
		const result = this.db.prepare(
			"INSERT INTO accounts " +
			"(address, version, type, name, data, encrypted_data) VALUES " +
			"(?, ?, ?, ?, ?, ?)").run(
				address, currentVersion, a.type, a.name, data, encryptedData)
		if (result.changes !== 1) {
			throw new Error(`Unexpected error while writing to Database!`)
		}
	}
}

