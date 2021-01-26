import sqlite3 from 'better-sqlite3'
import electron from 'electron'
import path from 'path'

let _db: sqlite3.Database | undefined

const db = (): sqlite3.Database => {
	if (!_db) {
		const dbpath = path.join(electron.remote.app.getPath("userData"), "celoaccounts-v0.db")
		console.info(`DB: opening database`, dbpath)
		const db = new sqlite3(dbpath, {fileMustExist: false, readonly: false})
		db.exec(`
			CREATE TABLE IF NOT EXISTS accounts (
				address TEXT PRIMARY KEY,
				type TEXT,
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

export interface AccountData {
	address: string
	type: string
	data: string
	encryptedData: string
}

export const readAccountData = (address: string): AccountData | undefined => {
	const row = db()
		.prepare(`SELECT * FROM accounts WHERE address = ?`)
		.bind(address.toLowerCase()).get()
	if (!row) {
		return undefined
	}
	return {
		address: row.address,
		type: row.type,
		data: row.data,
		encryptedData: row.encrypted_data,
	}
}