import * as React from 'react'
import { ensureLeading0x } from '@celo/utils/lib/address'

import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Alert from '@material-ui/lab/Alert'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import UnlockAccount from '../tx-runner/unlock-account'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Typography from '@material-ui/core/Typography'

import { decryptLocalKey, LocalKey } from '../../../lib/accounts/accountsdb'
import { LocalAccount } from '../../../lib/accounts/accounts'

const useStyles = makeStyles((theme) => ({
	textMnemonic: {
		fontWeight: "bold"
	},
	textPrivateKey: {
		overflowWrap: "anywhere",
		fontWeight: "bold",
		fontFamily: "monospace",
		fontSize: theme.typography.body2.fontSize,
	}
}))

const RevealLocalKey = (props: {
	account: LocalAccount,
	onClose: () => void,
}): JSX.Element => {
	const classes = useStyles()
	const [localKey, setLocalKey] = React.useState<LocalKey | undefined>()
	const handlePassword = (p: string) => {
		const k = decryptLocalKey(props.account.encryptedData, p)
		setLocalKey(k)
	}

	if (!localKey) {
		return (
			<UnlockAccount
				account={props.account}
				unlocking={false}
				onUnlock={handlePassword}
				onCancel={props.onClose}
			/>
		)
	} else {
		return (
			<Dialog open={true} onClose={props.onClose}>
				<DialogContent>
					<Alert severity="warning">
						Never share your mnemonic or private key with anyone else.
					</Alert>
					{localKey.mnemonic &&
					<Box marginTop={1}>
						<Card>
							<CardContent>
								<Typography color="textSecondary" gutterBottom>Mnemonic (24 words, BIP39, compatible with the Valora app)</Typography>
								<Typography className={classes.textMnemonic}>{localKey.mnemonic}</Typography>
							</CardContent>
						</Card>
					</Box>}
					<Box marginTop={1}>
						<Card>
							<CardContent>
								<Typography color="textSecondary" gutterBottom>Private Key</Typography>
								<Typography className={classes.textPrivateKey}>{ensureLeading0x(localKey.privateKey)}</Typography>
							</CardContent>
						</Card>
					</Box>
					<Box marginTop={1}>
						<Card>
							<CardContent>
								<Typography color="textSecondary" gutterBottom>Password Encrypted Key</Typography>
								<Typography className={classes.textPrivateKey}>{props.account.encryptedData}</Typography>
							</CardContent>
						</Card>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={props.onClose}>Close</Button>
				</DialogActions>
			</Dialog>
		)
	}
}
export default RevealLocalKey