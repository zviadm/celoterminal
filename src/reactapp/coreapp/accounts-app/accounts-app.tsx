import * as React from 'react'
import { ensureLeading0x } from '@celo/utils/lib/address'

import AppHeader from '../../components/app-header'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import GetAppIcon from '@material-ui/icons/GetApp'
import VpnKeyIcon from '@material-ui/icons/VpnKey'
import LockOpenIcon from '@material-ui/icons/LockOpen'
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet'
import VisibilityIcon from '@material-ui/icons/Visibility'
import DeleteIcon from '@material-ui/icons/Delete'
import DescriptionIcon from '@material-ui/icons/Description'

import AddAddressOnlyAccount from './addressonly-account'
import AddNewLocalAccount from './local-account'
import AddLedgerAccount from './ledger-account'
import ConfirmRemove from './confirm-remove'

import { makeStyles } from '@material-ui/core/styles'
import Alert from '@material-ui/lab/Alert'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import UnlockAccount from '../tx-runner/unlock-account'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import TextField from '@material-ui/core/TextField'

import { decryptLocalKey, LocalKey } from '../accountsdb'
import { Account, LocalAccount } from '../../state/accounts'
import Paper from '@material-ui/core/Paper'

export const accountsAppName = "Accounts"

const useStyles = makeStyles((theme) => ({
	root: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
	},
	section: {
		display: "flex",
		flexDirection: "column",
	},
	accountCard: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		minWidth: 500,
	},
	accountTextGroup: {
		display: "flex",
		flexDirection: "column",
		alignItems: "flex-start",
		flex: 1,
	},
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
	buttonGroup: {
		display: "flex",
		flexDirection: "row",
	},
	buttonAdd: {
		width: 200,
		marginRight: 10,
	},
	buttonPassword: {
		width: 410,
	}
}))

export const AccountsApp = (props: {
	accounts: Account[],
	onAdd: (a?: Account, password?: string) => void,
	onRemove: (a: Account) => void,
	onRename: (a: Account, name: string) => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [openedAdd, setOpenedAdd] = React.useState<
		undefined | "add-ledger" | "add-addressonly" | "add-newlocal">()
	const [confirmRemove, setConfirmRemove] = React.useState<Account | undefined>()
	const [revealAccount, setRevealAccount] = React.useState<LocalAccount | undefined>()
	const [renameAccount, setRenameAccount] = React.useState<Account | undefined>()
	const [renameNew, setRenameNew] = React.useState("")

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
	return (
		<Box className={classes.root}>
			{confirmRemove && <ConfirmRemove account={confirmRemove} onRemove={handleRemove} onCancel={handleCancel} />}
			{openedAdd === "add-newlocal" && <AddNewLocalAccount onAdd={handleAdd} onCancel={handleCancel} />}
			{openedAdd === "add-ledger" && <AddLedgerAccount onAdd={handleAdd} onCancel={handleCancel} onError={props.onError} />}
			{openedAdd === "add-addressonly" && <AddAddressOnlyAccount onAdd={handleAdd} onCancel={handleCancel} />}
			{revealAccount && <RevealPrivateKey account={revealAccount} onClose={handleCancel} onError={props.onError} />}
			{/* {renameAccount && <RenameAccount account={renameAccount} onRename={handleRename} onClose={handleCancel} />} */}

			<AppHeader title={"Accounts"} refetch={handleRefetch} isFetching={false} />
			<Box className={classes.section} my={2}>
				{
				props.accounts.map((a) => {
					return (
						<Box key={a.address} my={0.5}>
							<Paper>
								<Box className={classes.accountCard} p={2}>
								{
								a.type === "local" ? <VpnKeyIcon /> :
								a.type === "ledger" ? <AccountBalanceWalletIcon /> :
								a.type === "address-only" ? <VisibilityIcon /> : <></>
								}
								<Box className={classes.accountTextGroup} marginLeft={2}>
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
			<Box className={classes.section} my={2}>
				<Box className={classes.buttonGroup} my={1}>
					<Button
						className={classes.buttonAdd}
						color="primary"
						variant="contained"
						startIcon={<VpnKeyIcon />}
						onClick={() => { setOpenedAdd("add-newlocal") }}>Create Local Account</Button>
					<Button
						className={classes.buttonAdd}
						color="primary"
						variant="contained"
						startIcon={<GetAppIcon />}
						>Import Local Account</Button>
				</Box>
				<Box className={classes.buttonGroup} my={1}>
					<Button
						className={classes.buttonAdd}
						color="primary"
						variant="contained"
						startIcon={<AccountBalanceWalletIcon />}
						onClick={() => { setOpenedAdd("add-ledger") }}>Add Ledger Account</Button>
					<Button
						className={classes.buttonAdd}
						color="primary"
						variant="contained"
						startIcon={<VisibilityIcon />}
						onClick={() => { setOpenedAdd("add-addressonly") }}>Add ReadOnly Account</Button>
				</Box>
				<Box className={classes.buttonGroup} my={1}>
					<Button
						className={classes.buttonPassword}
						color="secondary"
						variant="outlined"
						startIcon={<LockOpenIcon />}
						>Change Password</Button>
				</Box>
			</Box>
		</Box>
	)
}

const useRevealKeyStyles = makeStyles((theme) => ({
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

const RevealPrivateKey = (props: {
	account: LocalAccount,
	onClose: () => void,
	onError: (e: Error) => void,
}) => {
	const classes = useRevealKeyStyles()
	const [localKey, setLocalKey] = React.useState<LocalKey | undefined>()
	const handlePassword = (p: string) => {
		try {
			const k = decryptLocalKey(props.account, p)
			setLocalKey(k)
		} catch (e) {
			props.onError(e)
		}
	}

	if (!localKey) {
		return (
			<UnlockAccount
				onPassword={handlePassword}
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
					<Box my={1}>
						<Card>
							<CardContent>
								<Typography color="textSecondary" gutterBottom>Mnemonic (24 words, BIP39, compatible with the Valora app)</Typography>
								<Typography className={classes.textMnemonic}>{localKey.mnemonic}</Typography>
							</CardContent>
						</Card>
					</Box>}
					<Box my={1}>
						<Card>
							<CardContent>
								<Typography color="textSecondary" gutterBottom>Private Key</Typography>
								<Typography className={classes.textPrivateKey}>{ensureLeading0x(localKey.privateKey)}</Typography>
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
