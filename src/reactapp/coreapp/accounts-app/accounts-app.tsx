import * as React from 'react'
import { shell } from 'electron'

import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import GetAppIcon from '@material-ui/icons/GetApp'
import LockOpenIcon from '@material-ui/icons/LockOpen'
import DeleteIcon from '@material-ui/icons/Delete'
import BackupIcon from '@material-ui/icons/Backup'
import DescriptionIcon from '@material-ui/icons/Description'
import TextField from '@material-ui/core/TextField'
import Paper from '@material-ui/core/Paper'

import AppHeader from '../../components/app-header'
import CreateLocalAccount from './create-local-account'
import ImportLocalAccount from './import-local-account'
import AddLedgerAccount from './ledger-account'
import AddAddressOnlyAccount from './addressonly-account'
import ConfirmRemove from './confirm-remove'
import RevealLocalKey from './reveal-local-key'
import { AddressOnlyAccountIcon, LedgerAccountIcon, LocalAccountIcon } from './account-icons'

import { accountsDB } from '../accountsdb'
import { Account, LocalAccount } from '../../state/accounts'

const useStyles = makeStyles((theme) => ({
	accountText: {
		fontFamily: "monospace",
	},
	buttonName: {
		padding: 0,
		marginLeft: 0,
		minWidth: 0,
		textAlign: "left",
		fontFamily: "monospace",
		textTransform: "none",
		fontSize: theme.typography.body1.fontSize,
	},
	buttonAdd: {
		marginTop: 10,
	},
}))

const AccountsApp = (props: {
	accounts: Account[],
	onAdd: (a?: Account, password?: string) => void,
	onRemove: (a: Account) => void,
	onRename: (a: Account, name: string) => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [openedAdd, setOpenedAdd] = React.useState<
		undefined | "add-ledger" | "add-addressonly" | "create-local" | "import-local">()
	const [confirmRemove, setConfirmRemove] = React.useState<Account | undefined>()
	const [revealAccount, setRevealAccount] = React.useState<LocalAccount | undefined>()
	const [renameAccount, setRenameAccount] = React.useState<Account | undefined>()
	const [renameNew, setRenameNew] = React.useState("")

	const handleAdd = (a: Account, password?: string) => {
		props.onAdd(a, password)
		setOpenedAdd(undefined)
	}
	const handleRemove = (a: Account) => {
		props.onRemove(a)
		setConfirmRemove(undefined)
	}
	const handleRename = (a: Account, name: string) => {
		if (a.name !== name) {
			props.onRename(a, name)
		}
		setRenameAccount(undefined)
	}
	const handleCancel = () => {
		setConfirmRemove(undefined)
		setOpenedAdd(undefined)
		setRevealAccount(undefined)
		setRenameAccount(undefined)
	}
	const handleRefetch = () => { props.onAdd() }

	const handleBackup = () => {
		shell.showItemInFolder(accountsDB().dbPath)
	}
	return (
		<Box display="flex" flexDirection="column" flex={1}>
			{confirmRemove && <ConfirmRemove account={confirmRemove} onRemove={handleRemove} onCancel={handleCancel} />}
			{openedAdd === "create-local" && <CreateLocalAccount onAdd={handleAdd} onCancel={handleCancel} onError={props.onError} />}
			{openedAdd === "import-local" && <ImportLocalAccount onAdd={handleAdd} onCancel={handleCancel} onError={props.onError} />}
			{openedAdd === "add-ledger" && <AddLedgerAccount onAdd={handleAdd} onCancel={handleCancel} onError={props.onError} />}
			{openedAdd === "add-addressonly" && <AddAddressOnlyAccount onAdd={handleAdd} onCancel={handleCancel} onError={props.onError} />}
			{revealAccount && <RevealLocalKey account={revealAccount} onClose={handleCancel} onError={props.onError} />}

			<AppHeader title={"Accounts"} refetch={handleRefetch} isFetching={false} />
			<Box display="flex" flexDirection="column" marginTop={2}>
				{
				props.accounts.map((a) => {
					return (
						<Box key={a.address} my={0.5}>
							<Paper>
								<Box
									display="flex"
									flexDirection="row"
									alignItems="center"
									minWidth={500}
									p={2}>
								{
								a.type === "local" ? <LocalAccountIcon /> :
								a.type === "ledger" ? <LedgerAccountIcon /> :
								a.type === "address-only" ? <AddressOnlyAccountIcon /> : <></>
								}
								<Box
									display="flex"
									flexDirection="column"
									alignItems="flex-start"
									flex={1}
									marginLeft={2}>
									{
									renameAccount === a ?
									<TextField
										autoFocus
										multiline
										margin="dense"
										value={renameNew}
										size="medium"
										fullWidth={true}
										inputProps={{className: classes.accountText}}
										onChange={(e) => { setRenameNew(e.target.value) }}
										onBlur={() => { handleRename(a, renameNew) }}
										onKeyPress={(e) => { (e.key === "Enter") && handleRename(a, renameNew) }}
									/>
									:
									<Button
										className={`${classes.buttonName}`}
										onClick={() => {
											setRenameAccount(a)
											setRenameNew(a.name)
										}}
										>{a.name === "" ? "____" : a.name}</Button>
									}
									<Typography className={classes.accountText}>{a.address}</Typography>
								</Box>
								{a.type === "local" &&
								<IconButton onClick={() => setRevealAccount(a)}>
									<DescriptionIcon />
								</IconButton>}
								<IconButton color="secondary" onClick={() => setConfirmRemove(a)}>
									<DeleteIcon />
								</IconButton>
								</Box>
							</Paper>
						</Box>
					)})
				}
			</Box>
			<Box marginTop={2}>
				<Paper>
					<Box display="flex" flexDirection="column" p={2}>
						<Button
							color="primary"
							variant="outlined"
							startIcon={<LocalAccountIcon />}
							onClick={() => { setOpenedAdd("create-local") }}>Create Local Account</Button>
						<Button
							className={classes.buttonAdd}
							color="primary"
							variant="outlined"
							startIcon={<GetAppIcon />}
							onClick={() => { setOpenedAdd("import-local") }}>Import Local Account</Button>
						<Button
							className={classes.buttonAdd}
							color="primary"
							variant="outlined"
							startIcon={<LedgerAccountIcon />}
							onClick={() => { setOpenedAdd("add-ledger") }}>Add Ledger Account</Button>
						<Button
							className={classes.buttonAdd}
							color="primary"
							variant="outlined"
							startIcon={<AddressOnlyAccountIcon />}
							onClick={() => { setOpenedAdd("add-addressonly") }}>Add ReadOnly Account</Button>
					</Box>
				</Paper>
				<Box marginTop={2}>
					<Paper>
						<Box display="flex" flexDirection="row" p={2}>
							<Box display="flex" flexDirection="column" flex={1} marginRight={1}>
								<Button
									color="secondary"
									variant="outlined"
									startIcon={<LockOpenIcon />}
									>Change Password</Button>
							</Box>
							<Box display="flex" flexDirection="column" flex={1} marginLeft={1}>
								<Button
									color="secondary"
									variant="outlined"
									startIcon={<BackupIcon />}
									onClick={handleBackup}
									>Backup Database</Button>
							</Box>
						</Box>
					</Paper>
				</Box>
			</Box>
		</Box>
	)
}
export default AccountsApp
