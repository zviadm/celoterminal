import sqlite3 from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import log from 'electron-log'
import { ensureLeading0x, toChecksumAddress } from '@celo/utils/lib/address'
import { isValidAddress } from 'ethereumjs-util'

import { Account, AddressOnlyAccount, LedgerAccount, LocalAccount } from '../renderer/state/accounts'

// Supported `account` row versions. Last version is the current version.
const supportedVersions = [1]
const currentVersion = supportedVersions[supportedVersions.length - 1]

class AccountsDB {
	private db
	// Prepared queries:
	private pSelectAccounts
	private pInsertAccount
	private pRemoveAccount
	private pRenameAccount
	private pSelectEncryptedAccounts
	private pUpdateEncryptedData
	private pSelectPassword
	private pUpdatePassword
	private pInsertPassword

	constructor(public readonly dbPath: string) {
		const dbdir = path.dirname(dbPath)
		fs.mkdirSync(dbdir, {recursive: true})
		log.info(`DB: opening database`, this.dbPath)
		this.db = new sqlite3(this.dbPath, {fileMustExist: false, readonly: false})
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS accounts (
				address TEXT PRIMARY KEY,
				version NUMBER,
				type TEXT,
				name TEXT,
				data TEXT,
				encrypted_data TEXT
			) WITHOUT ROWID;`)
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS password (
				id INTEGER PRIMARY KEY CHECK (id = 0),
				encrypted_password TEXT
			) WITHOUT ROWID;`)

		this.pSelectAccounts = this.db.prepare<[]>(`SELECT * FROM accounts`)
		this.pInsertAccount = this.db.prepare<
			[string, number, string, string, string, string]>(
			`INSERT INTO accounts
			(address, version, type, name, data, encrypted_data) VALUES
			(?, ?, ?, ?, ?, ?)`)
		this.pRemoveAccount = this.db.prepare<
			[string, string]>("DELETE FROM accounts WHERE address = ? AND type = ?")
		this.pRenameAccount = this.db.prepare<
			[string, string, string]>("UPDATE accounts SET name = ? WHERE address = ? AND type = ?")
		this.pSelectEncryptedAccounts = this.db.prepare<[]>(
			`SELECT address, type, encrypted_data FROM accounts WHERE encrypted_data IS NOT NULL AND encrypted_data != ''`)
		this.pUpdateEncryptedData = this.db.prepare<
			[string, string]>(`UPDATE accounts SET encrypted_data = ? WHERE address = ?`)

		this.pSelectPassword = this.db.prepare<[]>("SELECT * from password")
		this.pUpdatePassword = this.db.prepare<[string]>(`UPDATE password SET encrypted_password = ? WHERE id = 0`)
		this.pInsertPassword = this.db.prepare<[string]>(`INSERT INTO password (id, encrypted_password) VALUES (0, ?)`)
	}

	public close = () => {
		log.info(`DB: closing database`)
		this.db.close()
	}

	public readAccounts = (): Account[] => {
		const rows: {
			address: string
			name: string
			type: string
			version: number
			data: string
			encrypted_data: string
		}[] = this.pSelectAccounts.all()
		const accounts: Account[] = rows.filter(
			(r) => supportedVersions.indexOf(r.version) >= 0).map((r) => {
			const base = {
				type: r.type,
				name: r.name,
				address: toChecksumAddress(r.address),
			}
			switch (r.type) {
			case "address-only":
				return base as AddressOnlyAccount
			case "ledger": {
				const ledgerData = JSON.parse(r.data)
				return {
					...base,
					baseDerivationPath: ledgerData.baseDerivationPath,
					derivationPathIndex: ledgerData.derivationPathIndex,
				} as LedgerAccount
			}
			case "local":
				return {
					...base,
					encryptedData: r.encrypted_data,
				} as LocalAccount
			default:
				throw new Error(`Unrecognized account type: ${r.type}.`)
			}
		})
		return accounts
	}

	public addAccount = (a: Account, password?: string): void => {
		let data: string
		let encryptedData: string
		switch (a.type) {
		case "local":
			data = ""
			encryptedData = a.encryptedData
			if (!password) {
				throw new Error(`Password must be provided when adding local accounts.`)
			}
			// Sanity check to make sure encryptedData is decryptable.
			decryptLocalKey(encryptedData, password)
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
			throw new Error(`Unrecognized account type.`)
		}

		if (!isValidAddress(a.address)) {
			throw new Error(`Invalid address: ${a.address}.`)
		}
		const address = ensureLeading0x(a.address).toLowerCase()
		this.db.transaction(() => {
			if (password) {
				this._verifyAndUpdatePassword(password, password)
			}
			log.info(`accounts-db: adding account: ${a.type}/${address}.`)
			const result = this.pInsertAccount.run(
				address, currentVersion, a.type, a.name, data, encryptedData)
			if (result.changes !== 1) {
				throw new Error(`Unexpected error while adding account. Is Database corrupted?`)
			}
		})()
	}

	public removeAccount = (a: Account) => {
		log.info(`accounts-db: removing account: ${a.type}/${a.address}.`)
		this.pRemoveAccount.run(a.address.toLowerCase(), a.type)
	}

	public renameAccount = (a: Account, name: string) => {
		this.pRenameAccount.run(name, a.address.toLowerCase(), a.type)
	}

	public hasPassword = (): boolean => {
		const pws = this.pSelectPassword.all()
		return pws.length > 0
	}

	public changePassword = (oldPassword: string, newPassword: string) => {
		this.db.transaction(() => {
			this._verifyAndUpdatePassword(oldPassword, newPassword)
			log.info(`accounts-db: updating password...`)
			const accounts: {
				address: string,
				type: string,
				encrypted_data: string,
			}[] = this.pSelectEncryptedAccounts.all()
			for (const account of accounts) {
				log.info(`accounts-db: re-encrypting: ${account.type}/${account.address}...`)
				const newEncryptedData = encryptAES(decryptAES(account.encrypted_data, oldPassword), newPassword)
				decryptAES(newEncryptedData, newPassword) // sanity check!
				const result = this.pUpdateEncryptedData.run(newEncryptedData, account.address)
				if (result.changes !== 1) {
					throw new Error(`Unexpected error while updating encrypted data. Is Database corrupted?`)
				}
			}
			log.info(`accounts-db: password update complete.`)
		})()
	}

	// Must be called in a transaction.
	private _verifyAndUpdatePassword = (oldPassword: string, newPassword: string) => {
		const newEncryptedPassword = encryptAES(newPassword, newPassword)
		const pws: {encrypted_password: string}[] = this.pSelectPassword.all()
		if (pws.length > 1) {
			throw new Error(`Unexpected error while checking password. Is Database corrupted?`)
		}
		if (pws.length === 1) {
			try {
				const existingPassword = decryptAES(pws[0].encrypted_password, oldPassword)
				if (existingPassword !== oldPassword) {
					throw Error()
				}
			} catch (e) {
				throw new Error(`Password does not match with the already existing password for local accounts.`)
			}
			if (newPassword !== oldPassword) {
				const result = this.pUpdatePassword.run(newEncryptedPassword)
				if (result.changes !== 1) {
					throw new Error(`Unexpected error while updating password. Is Database corrupted?`)
				}
			}
		} else {
			const result = this.pInsertPassword.run(newEncryptedPassword)
			if (result.changes !== 1) {
				throw new Error(`Unexpected error while updating password. Is Database corrupted?`)
			}
		}
	}
}
export default AccountsDB

export interface LocalKey {
	mnemonic?: string
	privateKey: string
}

export const encryptLocalKey = (
	data: LocalKey,
	password: string): string => {
	return encryptAES(JSON.stringify(data), password)
}
export const decryptLocalKey = (
	encryptedData: string,
	password: string): LocalKey => {
	try {
		return JSON.parse(decryptAES(encryptedData, password))
	} catch (e) {
		throw new Error(`Incorrect password, can not decrypt local account.`)
	}
}

const IV_LENGTH = 16
const AES_KEY_LEN = 32
function encryptAES(plainData: string, password: string) {
	const iv = crypto.randomBytes(IV_LENGTH);
	const key = crypto.scryptSync(password, iv, AES_KEY_LEN)
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	return iv.toString('hex') + ":" + cipher.update(plainData).toString('hex') + cipher.final().toString('hex')
}
function decryptAES(encryptedData: string, password: string) {
	const parts = encryptedData.split(":")
	const iv = Buffer.from(parts[0], 'hex')
	const key = crypto.scryptSync(password, iv, AES_KEY_LEN)
	const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
	return Buffer.concat([decipher.update(Buffer.from(parts[1], 'hex')), decipher.final()]).toString()
}