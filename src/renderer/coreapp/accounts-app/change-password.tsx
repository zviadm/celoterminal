import * as React from 'react'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'

const ChangePassword = (props: {
	hasPassword: boolean,
	onChangePassword: (oldPassword: string, newPassword: string) => void
	onClose: () => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const [oldPassword, setOldPassword] = React.useState("")
	const [newPassword1, setNewPassword1] = React.useState("")
	const [newPassword2, setNewPassword2] = React.useState("")

	const handleChange = () => {
		try {
			if (newPassword1 !== newPassword2) {
				throw new Error(`Passwords do not match.`)
			}
			props.onChangePassword(oldPassword, newPassword1)
		} catch (e) {
			props.onError(e)
		}
	}
	return (
		<Dialog open={true} onClose={props.onClose}>
			<DialogTitle>{props.hasPassword ? "Change" : "Setup"} password</DialogTitle>
			<DialogContent>
				{props.hasPassword &&
				<TextField
					autoFocus
					margin="dense"
					type="password"
					label={`Current password`}
					value={oldPassword}
					size="medium"
					fullWidth={true}
					onChange={(e) => { setOldPassword(e.target.value) }}
				/>}
				<TextField
					autoFocus={!props.hasPassword}
					margin="dense"
					type="password"
					label={`New password`}
					value={newPassword1}
					size="medium"
					fullWidth={true}
					onChange={(e) => { setNewPassword1(e.target.value) }}
				/>
				<TextField
					margin="dense"
					type="password"
					label={`Confirm new password`}
					value={newPassword2}
					size="medium"
					fullWidth={true}
					onChange={(e) => { setNewPassword2(e.target.value) }}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose}>Cancel</Button>
				<Button
					color="secondary"
					disabled={newPassword1 === "" || newPassword1 !== newPassword2}
					onClick={handleChange}
					>Change</Button>
			</DialogActions>
		</Dialog>
	)
}
export default ChangePassword
