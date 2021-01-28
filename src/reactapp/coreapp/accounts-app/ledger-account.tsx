import * as React from 'react'

import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'

import { LedgerAccount } from '../../accountsdb/accounts'

const AddLedgerAccount = (props: {
	onAdd: (a: LedgerAccount) => void,
	onCancel: () => void,
}): JSX.Element => {
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Choose Ledger Account</DialogTitle>
			<DialogContent>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button>Add</Button>
			</DialogActions>
		</Dialog>
	)
}
export default AddLedgerAccount
