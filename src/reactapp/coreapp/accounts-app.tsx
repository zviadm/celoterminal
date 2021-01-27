import * as React from 'react'
import { isValidAddress } from 'ethereumjs-util'
import {
  generateKeys,
  generateMnemonic,
  MnemonicStrength,
} from '@celo/utils/lib/account'

import AppHeader from '../components/app-header'
import Dialog from '@material-ui/core/Dialog'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import IconButton from '@material-ui/core/IconButton'
import Delete from '@material-ui/icons/Delete'
import Alert from '@material-ui/lab/Alert'

import { Account, AddressOnlyAccount, LedgerAccount, LocalAccount } from '../accountsdb/accounts'
import { encryptLocalKey } from '../accountsdb/accountsdb'

export const accountsAppName = "Accounts"

export const AccountsApp = (props: {
	accounts: Account[],
	onAdd: (a?: Account, password?: string) => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const [openedAdd, setOpenedAdd] = React.useState<
		undefined | "add-ledger" | "add-addressonly" | "add-newlocal">()
	const onAdd = (a?: Account, password?: string) => {
		try {
			if (a) {
				props.onAdd(a, password)
			}
			setOpenedAdd(undefined)
		} catch (e) {
			props.onError(e)
		}
	}
	return (
		<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
			{openedAdd === "add-newlocal" && <AddNewLocalAccount onAdd={onAdd} />}
			{openedAdd === "add-ledger" && <AddLedgerAccount onAdd={onAdd} />}
			{openedAdd === "add-addressonly" && <AddAddressOnlyAccount onAdd={onAdd} />}

			<AppHeader title={"Accounts"} refetch={() => { props.onAdd() }} isFetching={false} />
			<Box p={2}>
				<List>
					{
					props.accounts.map((a) => (
						<ListItem key={a.address}>
							<ListItemText primary={a.address} />
							<ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete">
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
						</ListItem>
					))
					}
				</List>

			</Box>
			<Box p={2} style={{display: "flex", flexDirection: "column"}}>
				<div style={{display: "flex", flexDirection: "row"}}>
					<Box p={1}>
						<Button
							color="primary"
							variant="outlined"
							style={{width: 150}}
							onClick={() => { setOpenedAdd("add-newlocal") }}>Create Local Account</Button>
					</Box>
					<Box p={1}>
						<Button
							color="primary"
							variant="outlined"
							style={{width: 150}}
							>Import Local Account</Button>
					</Box>
				</div>
				<div style={{display: "flex", flexDirection: "row"}}>
					<Box p={1}>
						<Button
							color="primary"
							variant="outlined"
							style={{width: 150}}
							onClick={() => { setOpenedAdd("add-ledger") }}>Add Ledger Account</Button>
					</Box>
					<Box p={1}>
						<Button
							color="primary"
							variant="outlined"
							style={{width: 150}}
							onClick={() => { setOpenedAdd("add-addressonly") }}>Add ReadOnly Account</Button>
					</Box>
				</div>
				<Box p={1}>
					<Button
						color="secondary"
						variant="outlined"
						style={{width: 315}}
						>Change Password</Button>
				</Box>
			</Box>
		</div>
	)
}

const AddLedgerAccount = (props: {
	onAdd: (a?: LedgerAccount) => void,
}) => {
	return (
		<Dialog open={true}>
			<DialogTitle>Choose Ledger Account</DialogTitle>
			<DialogContent>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => { props.onAdd() }}>Cancel</Button>
				<Button>Add</Button>
			</DialogActions>
		</Dialog>
	)
}

const AddNewLocalAccount = (props: {
	onAdd: (a?: LocalAccount, password?: string) => void,
}) => {
	const [name, setName] = React.useState("")
	const [password, setPassword] = React.useState("")
	const [isAdding, setIsAdding] = React.useState(false)
	return (
		<Dialog open={true} onClose={() => { props.onAdd() }}>
			<DialogTitle>Create a new local account</DialogTitle>
			<DialogContent>
				<Alert severity="info">
					Name is used to identify your account in the app. You can change it at any time later on.
				</Alert>
				<TextField
						autoFocus
						margin="dense"
						label={`Name`}
						variant="outlined"
						value={name}
						size="medium"
						fullWidth={true}
						onChange={(e) => { setName(e.target.value) }}
					/>
				<Alert severity="info">
					Account address and private key are generated automatically and stored in a local database
					encrypted by your password.
				</Alert>
				<Alert severity="info">
					Same password must be used for all your local accounts.
				</Alert>
				<TextField
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
				<Button onClick={() => { props.onAdd() }}>Cancel</Button>
				<Button onClick={() => {
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
					.finally(() => {setIsAdding(false)})
				}}
				disabled={isAdding}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}

const AddAddressOnlyAccount = (props: {
	onAdd: (a?: AddressOnlyAccount) => void,
}) => {
	const [name, setName] = React.useState("")
	const [address, setAddress] = React.useState("")
	const canAdd = isValidAddress(address)
	return (
		<Dialog open={true} onClose={() => { props.onAdd() }}>
			<DialogTitle>Add a read-only account</DialogTitle>
			<DialogContent>
				<Alert severity="info">
					Name is used to identify your account in the app. You can change it at any time later on.
				</Alert>
				<TextField
						autoFocus
						margin="dense"
						label={`Name`}
						variant="outlined"
						value={name}
						size="medium"
						fullWidth={true}
						onChange={(e) => { setName(e.target.value) }}
					/>
				<TextField
						margin="dense"
						label={`Address`}
						variant="outlined"
						value={address}
						placeholder="0x..."
						size="medium"
						fullWidth={true}
						inputProps={{style: {fontSize: 14}}}
						onChange={(e) => { setAddress(e.target.value) }}
					/>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => { props.onAdd() }}>Cancel</Button>
				<Button onClick={() => { props.onAdd({
					type: "address-only",
					name: name,
					address: address,
					})}}
					disabled={!canAdd}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}