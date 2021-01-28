import * as React from 'react'

import AppHeader from '../../components/app-header'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import IconButton from '@material-ui/core/IconButton'
import Delete from '@material-ui/icons/Delete'
import AddAddressOnlyAccount from './addressonly-account'
import AddNewLocalAccount from './local-account'
import AddLedgerAccount from './ledger-account'
import Typography from '@material-ui/core/Typography'
import ConfirmRemove from './confirm-remove'

import { Account } from '../../state/accounts'

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
