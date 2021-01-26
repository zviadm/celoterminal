import sqlite3 from 'better-sqlite3'
import electron from 'electron'
import path from 'path'

let _db: sqlite3.Database | undefined

const db = (): sqlite3.Database => {
	if (!_db) {
		const dbpath = path.join(electron.remote.app.getPath("userData"), "celoaccounts-v0.db")
		console.info(`DB: opening database`, dbpath)
		const db = new sqlite3(dbpath, {fileMustExist: false, readonly: false})
		// // create tables if they don't already exist.
		// const p: Promise<void> = new Promise((resolve, reject) => {
		// 	db.serialize(() => {
		// 		db.run(
		// 			`
		// 			CREATE TABLE IF NOT EXISTS accounts (
		// 				address TEXT PRIMARY KEY,
		// 				type TEXT,
		// 				data TEXT,
		// 				encrypted_data TEXT,
		// 			) WITHOUT ROWID;
		// 			`)
		// 		resolve()
		// 	})
		// })
		// await p
		_db = db
	}
	return _db
}

export const closeDB = (): void => {
	console.info(`DB: closing database`)
	db().close()
}

export const readAccountData = () => {
	const d = db()
	return {}
}