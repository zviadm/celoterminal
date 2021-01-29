import * as React from 'react'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import Alert from '@material-ui/lab/Alert'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import DialogActions from '@material-ui/core/DialogActions'

const UnlockAccount = (props: {
	onPassword: (p: string) => void,
	onCancel: () => void,
}): JSX.Element => {
	const [password, setPassword] = React.useState("")
	const handleUnlock = () => {
		props.onPassword(password)
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Unlock account</DialogTitle>
			<DialogContent>
				<Alert severity="info">
					Password is required to unlock your local account.
				</Alert>
				<TextField
					autoFocus
					margin="dense"
					type="password"
					label={`Password`}
					variant="outlined"
					value={password}
					size="medium"
					fullWidth={true}
					onChange={(e) => { setPassword(e.target.value) }}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleUnlock}>Unlock</Button>
			</DialogActions>
		</Dialog>
	)
}
export default UnlockAccount
