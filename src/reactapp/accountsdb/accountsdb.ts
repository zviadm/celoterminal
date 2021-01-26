import sqlite3 from 'better-sqlite3'
import electron from 'electron'
import fs from 'fs'
import path from 'path'

import { Account } from './accounts'

// Supported `account` row versions. Last version is the current version.
const supportedVersions = [1]

let _db: sqlite3.Database | undefined

const db = (): sqlite3.Database => {
	if (!_db) {
		const dbdir = path.join(electron.remote.app.getPath("home"), ".celoterminal")
		fs.mkdirSync(dbdir, {recursive: true})
		const dbpath = path.join(dbdir, "celoaccounts-v0.db")
		console.info(`DB: opening database`, dbpath)
		const db = new sqlite3(dbpath, {fileMustExist: false, readonly: false})
		db.exec(`
			CREATE TABLE IF NOT EXISTS accounts (
				address TEXT PRIMARY KEY,
				version NUMBER,
				type TEXT,
				name TEXT,
				data TEXT,
				encrypted_data TEXT
			) WITHOUT ROWID;`)
		_db = db
	}
	return _db
}

export const closeDB = (): void => {
	console.info(`DB: closing database`)
	db().close()
}

export const readAccounts = (): Account[] => {
	const rows = db().prepare(`SELECT * FROM accounts`).all()
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