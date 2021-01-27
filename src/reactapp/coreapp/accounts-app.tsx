import * as React from 'react'

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

import { Account, AddressOnlyAccount, LedgerAccount } from '../accountsdb/accounts'

export const accountsAppName = "Accounts"

export const AccountsApp = (props: {
	accounts: Account[],
	onAdd: (a?: Account) => void,
}): JSX.Element => {
	const [openedAdd, setOpenedAdd] = React.useState<
		undefined | "add-ledger" | "add-addressonly">()
	const onAdd = (a?: Account) => {
		setOpenedAdd(undefined)
		if (!a) {
			return
		}
		props.onAdd(a)
	}
	return (
		<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
			<AddLedgerAccount open={openedAdd === "add-ledger"} onAdd={onAdd} />
			<AddAddressOnlyAccount open={openedAdd === "add-addressonly"} onAdd={onAdd} />

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
				<Button>Create Local Account</Button>
				<Button>Import Local Account</Button>
				<Button onClick={() => { setOpenedAdd("add-ledger") }}>Add Ledger Account</Button>
				<Button onClick={() => { setOpenedAdd("add-addressonly") }}>Add ReadOnly Account</Button>
			</Box>
		</div>
	)
}

const AddLedgerAccount = (props: {
	open: boolean,
	onAdd: (a?: LedgerAccount) => void,
}) => {

	return (
		<Dialog open={props.open}>
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

const AddAddressOnlyAccount = (props: {
	open: boolean,
	onAdd: (a?: AddressOnlyAccount) => void,
}) => {
	const [name, setName] = React.useState("")
	const [address, setAddress] = React.useState("0x")

	return (
		<Dialog open={props.open}>
			<DialogTitle>Enter Address</DialogTitle>
			<DialogContent>
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
					})}}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}