import * as React from 'react'
import {
  generateKeys,
} from '@celo/utils/lib/account'
import { privateKeyToAddress, trimLeading0x } from '@celo/utils/lib/address'

import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import Alert from '@material-ui/lab/Alert'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Radio from '@material-ui/core/Radio'
import Paper from '@material-ui/core/Paper'
import Box from '@material-ui/core/Box'

import { LocalAccount } from '../../../lib/accounts'
import { decryptLocalKey, encryptLocalKey, LocalKey } from '../../../lib/accountsdb'

const useStyles = makeStyles(() => ({
	secretText: {
		fontFamily: "monospace",
	},
}))

const ImportLocalAccount = (props: {
	onAdd: (a: LocalAccount, password?: string) => void,
	onError: (e: Error) => void,
	onCancel: () => void,
}): JSX.Element => {
	const classes = useStyles()
	const [name, setName] = React.useState("")
	const [password, setPassword] = React.useState("")

	const [importType, setImportType] = React.useState<
		"mnemonic" | "private-key" | "encrypted">("mnemonic")
	const [mnemonic, setMnemonic] = React.useState("")
	const [privateKey, setPrivateKey] = React.useState("")
	const [encryptedPrivateKey, setEncryptedPrivateKey] = React.useState("")
	const [encryptionPassword, setEncryptionPassword] = React.useState("")

	const [isAdding, setIsAdding] = React.useState(false)
	const handleAdd = () => {
		setIsAdding(true);
		(async () => {
			let key: LocalKey
			switch (importType) {
				case "mnemonic": {
					if (mnemonic.split(" ").length !== 24) {
						throw new Error(`Mnemonic must consist of 24 words.`)
					}
					const keys = await generateKeys(mnemonic)
					key = {mnemonic: mnemonic, privateKey: keys.privateKey}
					break
				}
				case "private-key": {
					key = {privateKey: trimLeading0x(privateKey)}
					break
				}
				case "encrypted": {
					key = decryptLocalKey(encryptedPrivateKey, encryptionPassword)
					break
				}
			}
			const encryptedData = encryptLocalKey(key, password)
			const address = privateKeyToAddress(key.privateKey)
			const account: LocalAccount = {
				type: "local",
				name,
				address,
				encryptedData,
			}
			props.onAdd(account, password)
		})()
		.catch((e) => {
			props.onError(e)
			setIsAdding(false)
		})
	}

	const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		setImportType(event.target.value as "mnemonic" | "private-key" | "encrypted")
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Import local account</DialogTitle>
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
					spellCheck={false}
					onChange={(e) => { setName(e.target.value) }}
				/>
				<Alert severity="info">
					Same password must be used for all your local accounts.
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
				<Box marginTop={1}>
				<Paper>
					<Box p={2}>
						<RadioGroup value={importType} onChange={handleSelect}>
							<FormControlLabel
								value="mnemonic"
								control={<Radio />}
								label="Using Mnemonic (BIP39, compatible with the Valora App)"
								/>
							{importType === "mnemonic" &&
							<TextField
								multiline
								margin="dense"
								label={`Mnemonic (24 words)`}
								value={mnemonic}
								size="medium"
								fullWidth={true}
								spellCheck={false}
								inputProps={{className: classes.secretText}}
								onChange={(e) => { setMnemonic(e.target.value) }}
							/>}
							<FormControlLabel
								value="private-key"
								control={<Radio />}
								label="Using Private Key"
								/>
							{importType === "private-key" &&
							<TextField
								multiline
								margin="dense"
								label={`Private Key (HEX encoded)`}
								value={privateKey}
								placeholder="0x"
								size="medium"
								fullWidth={true}
								spellCheck={false}
								inputProps={{className: classes.secretText}}
								onChange={(e) => { setPrivateKey(e.target.value) }}
							/>}
							<FormControlLabel
								value="encrypted"
								control={<Radio />}
								label="Using Password Encrypted Key (from CeloTerminal)"
								/>
							{importType === "encrypted" && <>
							<TextField
								multiline
								margin="dense"
								label={`Encrypted Data`}
								value={encryptedPrivateKey}
								size="medium"
								fullWidth={true}
								spellCheck={false}
								inputProps={{className: classes.secretText}}
								onChange={(e) => { setEncryptedPrivateKey(e.target.value) }}
							/>
							<TextField
								margin="dense"
								type="password"
								label={`Encryption Password`}
								value={encryptionPassword}
								size="medium"
								fullWidth={true}
								onChange={(e) => { setEncryptionPassword(e.target.value) }}
							/>
							</>}
						</RadioGroup>
					</Box>
				</Paper>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={isAdding}>Import</Button>
			</DialogActions>
		</Dialog>
	)
}
export default ImportLocalAccount
