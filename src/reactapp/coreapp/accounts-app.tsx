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
	onRemove: (a: Account) => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const [openedAdd, setOpenedAdd] = React.useState<
		undefined | "add-ledger" | "add-addressonly" | "add-newlocal">()
	const [confirmRemove, setConfirmRemove] = React.useState<Account | undefined>()

	const handleAdd = (a: Account, password?: string) => {
		try {
			props.onAdd(a, password)
			setOpenedAdd(undefined)
		} catch (e) {
			props.onError(e)
		}
	}
	const handleRemove = (a: Account) => {
		props.onRemove(a)
		setConfirmRemove(undefined)
	}
	const handleCancel = () => {
		setConfirmRemove(undefined)
		setOpenedAdd(undefined)
	}
	const handleRefetch = () => { props.onAdd() }
	return (
		<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
			{confirmRemove && <ConfirmRemove account={confirmRemove} onRemove={handleRemove} onCancel={handleCancel} />}
			{openedAdd === "add-newlocal" && <AddNewLocalAccount onAdd={handleAdd} onCancel={handleCancel} />}
			{openedAdd === "add-ledger" && <AddLedgerAccount onAdd={handleAdd} onCancel={handleCancel} />}
			{openedAdd === "add-addressonly" && <AddAddressOnlyAccount onAdd={handleAdd} onCancel={handleCancel} />}

			<AppHeader title={"Accounts"} refetch={handleRefetch} isFetching={false} />
			<Box p={2}>
				<List>
					{
					props.accounts.map((a) => (
						<ListItem key={a.address}>
							<ListItemText primary={a.address} />
							<ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete" onClick={() => setConfirmRemove(a)}>
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
	onAdd: (a: LedgerAccount) => void,
	onCancel: () => void,
}) => {
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

const AddNewLocalAccount = (props: {
	onAdd: (a: LocalAccount, password?: string) => void,
	onCancel: () => void,
}) => {
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
			setIsAdding(false)
		})()
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
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
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={isAdding}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}

const AddAddressOnlyAccount = (props: {
	onAdd: (a: AddressOnlyAccount) => void,
	onCancel: () => void,
}) => {
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
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={!canAdd}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}

const ConfirmRemove = (props: {
	account: Account,
	onRemove: (a: Account) => void,
	onCancel: () => void,
}) => {
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
					inputProps={{style: {fontSize: 14}}}
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