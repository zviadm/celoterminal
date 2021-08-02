import * as sqliteDB from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'
import * as log from 'electron-log'

export interface Claim {
	amount: string
	index: number
	proof: Array<string>
}
export interface Merkle {
  merkleRoot: string
  tokenTotal: string
	contractAddress: string
	claims: Record<string, Claim>
}

export interface Transfer {
	id: string
	disbursement_id: string
  address: string
  earnings: string
	reasons: string
	status: string
}

export type Disbursement = {
	id: string
	contract: string
	date: number
	amount: string
	status: string
	currency: string
}

class DisbursementsDB {
	private db
	// Prepared queries:
	private pSelectDisbursements
	private pInsertDisbursement
	private pUpdateDisbursement
	private pRemoveDisbursement
	private pSelectDisbursement
	private pInsertTransfer
	private pUpdateTransfer
	private pRemoveTransfer
	private pSelectTransfersByDisrbursement



	constructor(public readonly dbPath: string) {
		const dbdir = path.dirname(dbPath)
		fs.mkdirSync(dbdir, {recursive: true})
		log.info(`DB: opening database`, this.dbPath)
		this.db = sqliteDB(this.dbPath, {fileMustExist: false, readonly: false})
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS 'disbursements' (
				'id' TEXT PRIMARY KEY,
				'contract' TEXT,
				'date' NUMERIC,
				'amount' TEXT,
				'status' TEXT,
				'currency' TEXT
				) WITHOUT ROWID;`)

		this.db.exec(`
			CREATE TABLE IF NOT EXISTS 'transfers' (
				'id' TEXT PRIMARY KEY,
				'disbursement_id' TEXT NOT NULL,
				'address' TEXT,
				'earnings' TEXT,
				'reasons' TEXT,
				'status' TEXT
				) WITHOUT ROWID;`)		


		this.pSelectDisbursements = this.db.prepare<[]>(`SELECT * FROM 'disbursements' ORDER BY date DESC`)
		this.pInsertDisbursement = this.db.prepare<
			[string, string, number, string, string, string]>(
			`INSERT INTO 'disbursements'
			('id','contract', 'date', 'amount', 'status', 'currency') VALUES
			(?, ?, ?, ?, ?, ?);`)

		this.pInsertTransfer = this.db.prepare<
			[string, string, string, string, string, string]>(
			`INSERT INTO 'transfers'
			('id','disbursement_id', 'address', 'earnings', 'reasons', 'status') VALUES
			(?, ?, ?, ?, ?, ?);`)

		this.pSelectTransfersByDisrbursement = this.db.prepare<
			[string]>(`SELECT * FROM 'transfers' WHERE disbursement_id = ?`)

		this.pUpdateDisbursement = this.db.prepare<
			[string, number, string, string, string]>(`UPDATE 'disbursements' SET contract = ?, date = ?, amount = ?, status = ? WHERE id = ?`)

		this.pUpdateTransfer = this.db.prepare<
			[string, string ]>(`UPDATE 'transfers' SET status = ? WHERE id = ?`)
		
		this.pRemoveTransfer = this.db.prepare<
			[string]>(`DELETE FROM 'transfers' WHERE id = ?`)
			
		this.pRemoveDisbursement = this.db.prepare<
			[string]>(`DELETE FROM 'disbursements' WHERE 'contract' = ?`)

		this.pSelectDisbursement = this.db.prepare<
			[string]>(`SELECT 'disbursements' WHERE 'contract' = ?`)
	}

	public close = (): void => {
		log.info(`DB: closing database`)
		this.db.close()
	}

	public readDisbursements = (): Disbursement[] => {
		const rows: {
			id: string
			contract: string
			date: number
			amount: string
			status: string
			currency: string
		}[] = this.pSelectDisbursements.all()
		return rows
	}

	public addDisbursement = (d: Disbursement): void => {
		this.db.transaction(() => {
			log.info(`disbursement-db: adding disbursement: ${d.id}.`)
			try {
				const result = this.pInsertDisbursement.run(
					d.id, d.contract, d.date, d.amount, d.status, d.currency)
				if (result.changes !== 1) {
					throw new Error(`Unexpected error while adding account. Is Database corrupted?`)
				}
			} catch (e) {
				if (e instanceof Error && e.message.startsWith("UNIQUE")) {
					throw new Error(`Disrbursement with id: ${d.id} already exists.`)
				}
				throw e
			}
		})()
	}

	public updateDisbursement = (d: Disbursement): void => {
		log.info(`disbursement-db: updating disbursement: ${d.id}.`)
		this.pUpdateDisbursement.run(d.contract, d.date, d.amount, d.status, d.id)
	}

	public updateTransfer = (t: Transfer): void => {
		log.info(`disbursement-db: updating transfer: ${t.id}.`)
		this.pUpdateTransfer.run(t.status, t.id)
	}

	public addTransfer = (t: Transfer): void => {
		this.db.transaction(() => {
			log.info(`transfer-db: adding transfer: ${t.id}.`)
			try {
				const result = this.pInsertTransfer.run(
					t.id, t.disbursement_id, t.address, t.earnings, t.reasons, t.status)
				if (result.changes !== 1) {
					throw new Error(`Unexpected error while adding account. Is Database corrupted?`)
				}
			} catch (e) {
				if (e instanceof Error && e.message.startsWith("UNIQUE")) {
					throw new Error(`Transfer with id: ${t.id} already exists.`)
				}
				throw e
			}
		})()
	}

	public selectTransfersByDisbursement= (d_id: string): Transfer[] => {
		const rows: {
			id: string
			disbursement_id: string
			address: string
			earnings: string
			reasons: string
			status: string
		}[] = this.pSelectTransfersByDisrbursement.all(d_id)
		return rows
	}

	public removeDisbursement = (d: Disbursement): void => {
		log.info(`disbursements-db: removing disbursement: ${d.id}.`)
		this.pRemoveDisbursement.run(d.id)
	}

	public removeTransfer = (t: Transfer): void => {
		log.info(`transfers-db: removing transfer: ${t.id}.`)
		this.pRemoveTransfer.run(t.id)
	}

	public selectDisbursement = (id: string): void => {
		this.pSelectDisbursement.run(id)
	}

}
export default DisbursementsDB
