import * as React from 'react'

import AppHeader from '../../components/app-header'
import Dialog from '@material-ui/core/Dialog'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
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

import { Account } from '../../state/accounts'
import AddAddressOnlyAccount from './addressonly-account'
import AddNewLocalAccount from './local-account'
import AddLedgerAccount from './ledger-account'
import Typography from '@material-ui/core/Typography'

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
			{openedAdd === "add-ledger" && <AddLedgerAccount onAdd={handleAdd} onCancel={handleCancel} onError={props.onError} />}
			{openedAdd === "add-addressonly" && <AddAddressOnlyAccount onAdd={handleAdd} onCancel={handleCancel} />}

			<AppHeader title={"Accounts"} refetch={handleRefetch} isFetching={false} />
			<Box p={2}>
				<List>
					{
					props.accounts.map((a) => (
						<ListItem key={a.address}>
							<ListItemText primary={<div>
								<Typography style={{fontFamily: "monospace"}}>{a.name}: </Typography>
								<Typography style={{fontFamily: "monospace"}}>{a.address}</Typography>
								</div>} />
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