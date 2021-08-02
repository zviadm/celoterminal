import * as React from 'react'
import electron from 'electron'
import path from 'path'

import useLocalStorageState from '../../state/localstorage-state'
import DisbursementsDB, { Disbursement, Transfer } from './disbursementsdb'

let _db: DisbursementsDB

const disbursementsDB = (): DisbursementsDB => {
	if (!_db) {
		const dbPath = path.join(
			electron.remote.app.getPath("home"), "/.celoterminal/disbursements.db")
		try {
			_db = new DisbursementsDB(dbPath)
		} catch (e) {
			electron.remote.dialog.showMessageBoxSync({
				type: "error",
				title: "CRASH",
				message:
					`Accounts database: ${dbPath} can not be created or opened.\n` +
					`CeloTerminal can not start.\n\n${e}`,
			})
			electron.remote.app.quit()
			throw e
		}
		window.addEventListener('unload', () => { _db.close() })
	}
	return _db
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useDisbursements = () => {
	const [_disbursements, setDisbursements] = React.useState<Disbursement[] | undefined>()
	const [transfers, setTransfers] = React.useState<Transfer[]>()
	const [_selectedDisbursement, setSelectedDisbursement] =
		useLocalStorageState<Disbursement | undefined>("terminal/core/selected-disbursement", undefined)
	const refreshDisbursements = () => {
		const disbursements = disbursementsDB().readDisbursements()
		setDisbursements(disbursements)
		return {disbursements}
	}
	let disbursements = _disbursements
	if (!disbursements) {
		const initial = refreshDisbursements()
		disbursements = initial.disbursements
	}

	const refreshTransfers = (disbursement_id : string) => {
		const transfers = disbursementsDB().selectTransfersByDisbursement(disbursement_id)
		setTransfers(transfers)
		return {transfers}
	}



	const addDisbursement = (d?: Disbursement) => {
		if (d) {
			disbursementsDB().addDisbursement(d)
		}
		refreshDisbursements()
	}
	const removeDisbursement = (d: Disbursement) => {
		disbursementsDB().removeDisbursement(d)
		refreshDisbursements()
	}

	const updateDisbursement = (d: Disbursement) => {
		disbursementsDB().updateDisbursement(d)
		refreshDisbursements()
	}

	const addTransferDB = (t?: Transfer) => {
		if (t) {
			disbursementsDB().addTransfer(t)
		}
		refreshDisbursements()
	}

	const updateTransfer = (t: Transfer) => {
		disbursementsDB().updateTransfer(t)
		refreshDisbursements()
		refreshTransfers(t.disbursement_id)
	}
	

	const removeTransfer = (t: Transfer) => {
		disbursementsDB().removeTransfer(t)
		refreshDisbursements()
		refreshTransfers(t.disbursement_id)
	}

	const selectedDisbursement =
		!disbursements ? _selectedDisbursement :
		disbursements.length === 0 ? undefined :
		disbursements.find((a) => a.id === _selectedDisbursement?.id)
	if (selectedDisbursement && selectedDisbursement !== _selectedDisbursement) {
		setSelectedDisbursement(selectedDisbursement)
	}

	const selectedDisbursementTransfers = (d?: Disbursement) => {
		if (d) {
			const t = disbursementsDB().selectTransfersByDisbursement(d.id)
			setTransfers(t)
		}
		refreshDisbursements()
	}

	return {
		disbursements,
		addDisbursement,
		removeDisbursement,
		setSelectedDisbursement,
		selectedDisbursement,
		updateDisbursement,
		transfers,
		setTransfers,
		addTransferDB,
		updateTransfer,
		removeTransfer,
		selectedDisbursementTransfers
	}
}

export const disbursementsDBFilePath = (): string => {
	return disbursementsDB().dbPath
}
