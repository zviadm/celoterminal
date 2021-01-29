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

import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import UnlockAccount from '../tx-runner/unlock-account'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'

import { decryptLocalKey, LocalKey } from '../accountsdb'
import { Account, LocalAccount } from '../../state/accounts'
import Alert from '@material-ui/lab/Alert'

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
		<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
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
						<Card key={a.address} style={{marginTop: 10, width: 500}}>
							<CardContent>
								<div style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center"}}>
									{
									a.type === "local" ? <VpnKeyIcon /> :
									a.type === "ledger" ? <AccountBalanceWalletIcon /> :
									a.type === "address-only" ? <VisibilityIcon /> : <></>
									}
									<div style={{
										display: "flex",
										flexDirection: "column",
										flex: 1,
										marginLeft: 20}}>
										<Typography style={{fontFamily: "monospace"}}>{a.name}</Typography>
										<Typography style={{fontFamily: "monospace"}}>{a.address}</Typography>
									</div>
									{a.type === "local" &&
									<IconButton onClick={() => setRevealAccount(a)}>
										<DescriptionIcon />
									</IconButton>}
									<IconButton color="secondary" onClick={() => setConfirmRemove(a)}>
										<DeleteIcon />
									</IconButton>
								</div>
							</CardContent>
						</Card>
					)})
				}
			</Box>
			<Box py={2} style={{display: "flex", flexDirection: "column"}}>
				<div style={{display: "flex", flexDirection: "row", marginTop: 10}}>
					<Box style={{marginRight: 10}}>
						<Button
							color="primary"
							variant="contained"
							style={{width: 200}}
							startIcon={<VpnKeyIcon />}
							onClick={() => { setOpenedAdd("add-newlocal") }}>Create Local Account</Button>
					</Box>
					<Box>
						<Button
							color="primary"
							variant="contained"
							style={{width: 200}}
							startIcon={<GetAppIcon />}
							>Import Local Account</Button>
					</Box>
				</div>
				<div style={{display: "flex", flexDirection: "row", marginTop: 10}}>
					<Box style={{marginRight: 10}}>
						<Button
							color="primary"
							variant="contained"
							style={{width: 200}}
							startIcon={<AccountBalanceWalletIcon />}
							onClick={() => { setOpenedAdd("add-ledger") }}>Add Ledger Account</Button>
					</Box>
					<Box>
						<Button
							color="primary"
							variant="contained"
							style={{width: 200}}
							startIcon={<VisibilityIcon />}
							onClick={() => { setOpenedAdd("add-addressonly") }}>Add ReadOnly Account</Button>
					</Box>
				</div>
				<Box style={{marginTop: 10}}>
					<Button
						color="secondary"
						variant="outlined"
						style={{width: 410}}
						startIcon={<LockOpenIcon />}
						>Change Password</Button>
				</Box>
			</Box>
		</div>
	)
}

const RevealPrivateKey = (props: {
	account: LocalAccount,
	onClose: () => void,
	onError: (e: Error) => void,
}) => {
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
			<Dialog open={true}>
				<DialogContent>
					<Alert severity="warning">
						Never share your mnemonic or private key with anyone else.
					</Alert>
					{localKey.mnemonic &&
					<Card title="Mnemonic" style={{marginTop: 10}}>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>Mnemonic (24 words, BIP39, compatible with the Valora app)</Typography>
							<Typography style={{fontWeight: "bold"}}>{localKey.mnemonic}</Typography>
						</CardContent>
					</Card>}
					<Card title="Private Key" style={{marginTop: 10}}>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>Private Key</Typography>
							<Typography style={{
								overflowWrap: "anywhere",
								fontWeight: "bold",
								fontFamily: "monospace",
								fontSize: 12}}>{ensureLeading0x(localKey.privateKey)}</Typography>
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