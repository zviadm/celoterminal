import * as React from 'react'

import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import Alert from '@material-ui/lab/Alert'

import { Account } from '../../state/accounts'

const ConfirmRemove = (props: {
	account: Account,
	onRemove: (a: Account) => void,
	onCancel: () => void,
}): JSX.Element => {
	const [address, setAddress] = React.useState("")
	const handleRemove = () => { props.onRemove(props.account) }
	const canRemove = props.account.type !== "local" || props.account.address === address
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogContent>
				{props.account.type === "local" ? <>
				<Alert severity="warning">
					DANGER ZONE! Removing local account will permanently remove its mnemonic and private key
					from the local database. If you do not have backups, it will be impossible to restore this account
					in future.
				</Alert>
				<Alert severity="info">
					Confirm the address of your local account that you are attempting to remove to proceed.
				</Alert>
				<TextField
					autoFocus
					margin="dense"
					label={`Address`}
					variant="outlined"
					value={address}
					placeholder="0x..."
					size="medium"
					fullWidth={true}
					inputProps={{style: {fontFamily: "monospace"}}}
					onChange={(e) => { setAddress(e.target.value) }}
				/>
				</> :
				<Alert severity="warning">
					Are you sure you want to remove &quot;{props.account.name}&quot; {props.account.address}?
				</Alert>}
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button color="secondary" onClick={handleRemove} disabled={!canRemove}>Remove</Button>
			</DialogActions>
		</Dialog>
	)
}
export default ConfirmRemove