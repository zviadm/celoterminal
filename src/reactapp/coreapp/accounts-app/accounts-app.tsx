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

import { decryptLocalKey, LocalKey } from '../accountsdb'
import { Account, LocalAccount } from '../../state/accounts'

export const accountsAppName = "Accounts"

const useStyles = makeStyles(() => ({
	accountCard: {
		marginTop: 10,
		width: 500,
	},
	accountCardContent: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center"
	},
	accountTextGroup: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
		marginLeft: 20,
	},
	accountText: {
		fontFamily: "monospace",
	},
	buttonGroup: {
		display: "flex",
		flexDirection: "row",
		marginTop: 10,
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
	onError: (e: Error) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [openedAdd, setOpenedAdd] = React.useState<
		undefined | "add-ledger" | "add-addressonly" | "add-newlocal">()
	const [confirmRemove, setConfirmRemove] = React.useState<Account | undefined>()
	const [revealAccount, setRevealAccount] = React.useState<LocalAccount | undefined>()

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
		setRevealAccount(undefined)
	}
	const handleRefetch = () => { props.onAdd() }
	return (
		<div style={{display: "flex", flexDirection: "column"}}>
			{confirmRemove && <ConfirmRemove account={confirmRemove} onRemove={handleRemove} onCancel={handleCancel} />}
			{openedAdd === "add-newlocal" && <AddNewLocalAccount onAdd={handleAdd} onCancel={handleCancel} />}
			{openedAdd === "add-ledger" && <AddLedgerAccount onAdd={handleAdd} onCancel={handleCancel} onError={props.onError} />}
			{openedAdd === "add-addressonly" && <AddAddressOnlyAccount onAdd={handleAdd} onCancel={handleCancel} />}
			{revealAccount && <RevealPrivateKey account={revealAccount} onClose={handleCancel} onError={props.onError} />}

			<AppHeader title={"Accounts"} refetch={handleRefetch} isFetching={false} />
			<Box py={2} style={{display: "flex", flexDirection: "column", alignSelf: "start"}}>
				{
				props.accounts.map((a) => {
					return (
						<Card className={classes.accountCard} key={a.address}>
							<CardContent className={classes.accountCardContent}>
								{
								a.type === "local" ? <VpnKeyIcon /> :
								a.type === "ledger" ? <AccountBalanceWalletIcon /> :
								a.type === "address-only" ? <VisibilityIcon /> : <></>
								}
								<div className={classes.accountTextGroup}>
									<Typography className={classes.accountText}>{a.name}</Typography>
									<Typography className={classes.accountText}>{a.address}</Typography>
								</div>
								{a.type === "local" &&
								<IconButton onClick={() => setRevealAccount(a)}>
									<DescriptionIcon />
								</IconButton>}
								<IconButton color="secondary" onClick={() => setConfirmRemove(a)}>
									<DeleteIcon />
								</IconButton>
							</CardContent>
						</Card>
					)})
				}
			</Box>
			<Box py={2} style={{display: "flex", flexDirection: "column"}}>
				<div  className={classes.buttonGroup}>
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
				</div>
				<div className={classes.buttonGroup}>
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
				</div>
				<div className={classes.buttonGroup}>
					<Button
						className={classes.buttonPassword}
						color="secondary"
						variant="outlined"
						startIcon={<LockOpenIcon />}
						>Change Password</Button>
				</div>
			</Box>
		</div>
	)
}

const useRevealKeyStyles = makeStyles(() => ({
	card: {
		marginTop: 10,
	},
	textMnemonic: {
		fontWeight: "bold"
	},
	textPrivateKey: {
		overflowWrap: "anywhere",
		fontWeight: "bold",
		fontFamily: "monospace",
		fontSize: 12,
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
					<Card className={classes.card}>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>Mnemonic (24 words, BIP39, compatible with the Valora app)</Typography>
							<Typography className={classes.textMnemonic}>{localKey.mnemonic}</Typography>
						</CardContent>
					</Card>}
					<Card className={classes.card}>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>Private Key</Typography>
							<Typography className={classes.textPrivateKey}>{ensureLeading0x(localKey.privateKey)}</Typography>
						</CardContent>
					</Card>
				</DialogContent>
				<DialogActions>
					<Button onClick={props.onClose}>Close</Button>
				</DialogActions>
			</Dialog>
		)
	}
}