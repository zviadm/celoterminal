import { Account } from '../../../lib/accounts/accounts'
import { UserError } from '../../../lib/error'

import * as React from 'react'

import {
	Dialog, DialogTitle, DialogContent,
	LinearProgress, TextField, Button, DialogActions, Box
 } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

const UnlockAccount = (props: {
	account: Account,
	unlocking: boolean,
	onUnlock: (p: string) => void,
	onCancel: (e?: Error) => void,
}): JSX.Element => {
	const [password, setPassword] = React.useState("")
	const handleUnlock = () => {
		props.onUnlock(password)
	}
	const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value) }
	const handleOnKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => { (e.key === "Enter") && handleUnlock() }

	const accountType = props.account.type
	const onCancel = props.onCancel
	React.useEffect(() => {
		if (
			accountType !== "local" &&
			accountType !== "ledger"
			) {
			onCancel(new UserError(`Account type '${accountType}' can not sign transactions.`))
		}
	}, [accountType, onCancel])
	return (
		<Dialog open={true} onClose={() => { onCancel() }}>
			<DialogTitle>Unlock account</DialogTitle>
			<DialogContent style={{width: 500}}>
				<Box display="flex" flexDirection="column">
					{
					accountType === "local" ?
					<>
						<Alert severity="info">
							Password is required to unlock your local account.
						</Alert>
						<TextField
							id="password-input"
							autoFocus
							margin="dense"
							type="password"
							label={`Password`}
							variant="outlined"
							value={password}
							size="medium"
							fullWidth={true}
							onChange={handleOnChange}
							onKeyPress={handleOnKeyPress}
						/>
					</> :
					accountType === "ledger" ?
					<>
					<Alert severity="info">
						Make sure your Ledger device is connected, unlocked, and the Celo app is launched.
					</Alert>
					</> :
					<></>
					}
					{props.unlocking && <LinearProgress color="primary" />}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button
					disabled={props.unlocking}
					onClick={() => { onCancel() }}>Cancel</Button>
				<Button
					id="unlock-password"
					disabled={props.unlocking}
					onClick={handleUnlock}>Unlock</Button>
			</DialogActions>
		</Dialog>
	)
}
export default UnlockAccount
