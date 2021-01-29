import * as React from 'react'
import { isValidAddress } from 'ethereumjs-util'

import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import Alert from '@material-ui/lab/Alert'

import { AddressOnlyAccount } from '../../state/accounts'

const useStyles = makeStyles(() => ({
	address: {
		fontFamily: "monospace",
	}
}))

const AddAddressOnlyAccount = (props: {
	onAdd: (a: AddressOnlyAccount) => void,
	onCancel: () => void,
}): JSX.Element => {
	const classes = useStyles()
	const [name, setName] = React.useState("")
	const [address, setAddress] = React.useState("")
	const canAdd = isValidAddress(address)
	const handleAdd = () => {
		props.onAdd({
			type: "address-only",
			name: name,
			address: address,
		})
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Add a read-only account</DialogTitle>
			<DialogContent>
				<Alert severity="info">
					Name is used to identify your account in the app. You can change it at any time later on.
				</Alert>
				<TextField
						autoFocus
						margin="dense"
						label={`Name`}
						value={name}
						size="medium"
						fullWidth={true}
						onChange={(e) => { setName(e.target.value) }}
					/>
				<TextField
						margin="dense"
						label={`Address`}
						value={address}
						placeholder="0x..."
						size="medium"
						fullWidth={true}
						inputProps={{className: classes.address}}
						onChange={(e) => { setAddress(e.target.value) }}
					/>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleAdd} disabled={!canAdd}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}
export default AddAddressOnlyAccount
