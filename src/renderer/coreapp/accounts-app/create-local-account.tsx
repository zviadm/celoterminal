import * as React from 'react'
import {
	generateKeys,
	generateMnemonic,
	MnemonicStrength,
} from '@celo/utils/lib/account'

import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import Alert from '@material-ui/lab/Alert'

import { LocalAccount } from '../../../lib/accounts'
import { encryptLocalKey } from '../../../lib/accountsdb'

const CreateLocalAccount = (props: {
	onAdd: (a: LocalAccount, password?: string) => void,
	onCancel: () => void,
}): JSX.Element => {
	const [name, setName] = React.useState("")
	const [password, setPassword] = React.useState("")
	const [isAdding, setIsAdding] = React.useState(false)
	const handleAdd = () => {
		setIsAdding(true);
		(async () => {
			const mnemonic = await generateMnemonic(MnemonicStrength.s256_24words)
			const keys = await generateKeys(mnemonic)
			const encryptedData = encryptLocalKey({mnemonic: mnemonic, privateKey: keys.privateKey}, password)
			props.onAdd({
				type: "local",
				name: name,
				address: keys.address,
				encryptedData: encryptedData,
			}, password)
		})()
		.catch((e) => {
			setIsAdding(false)
			throw e
		})
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Create local account</DialogTitle>
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
				<Alert severity="info">
					Account address and private key are generated automatically and stored in a local database
					encrypted by your password.
				</Alert>
				<TextField
					margin="dense"
					type="password"
					label={`Password`}
					value={password}
					size="medium"
					fullWidth={true}
					onChange={(e) => { setPassword(e.target.value) }}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={isAdding}>Create</Button>
			</DialogActions>
		</Dialog>
	)
}
export default CreateLocalAccount
