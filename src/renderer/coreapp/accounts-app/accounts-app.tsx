import { shell } from 'electron'

import { Account, LocalAccount, MultiSigAccount } from '../../../lib/accounts'
import { accountsDBFilePath } from './accounts-state'
import Accounts from './def'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'

import * as React from 'react'
import {
	makeStyles, Tooltip, Box, Button, IconButton, Typography,
	TextField, Paper,
} from '@material-ui/core'
import * as icons from '@material-ui/icons'

import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import AppHeader from '../../components/app-header'
import CreateLocalAccount from './create-local-account'
import ImportLocalAccount from './import-local-account'
import AddLedgerAccount from './ledger-account'
import AddAddressOnlyAccount from './addressonly-account'
import ConfirmRemove from './confirm-remove'
import RevealLocalKey from './reveal-local-key'
import ChangePassword from './change-password'
import AccountIcon from './account-icon'
import CreateMultiSigAccount from './create-multisig-account'
import ModifyMultiSig from './modify-multisig'

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
	selectedAccount?: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,

	hasPassword: boolean,
	onAdd: (a?: Account, password?: string, update?: boolean) => void,
	onRemove: (a: Account) => void,
	onRename: (a: Account, name: string) => void,
	onChangePassword: (oldPassword: string, newPassword: string) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [openedAdd, setOpenedAdd] = React.useState<
		undefined |
		"add-ledger" | "add-addressonly" |
		"create-local" | "import-local" |
		"create-multisig" | "import-multisig">()
	const [confirmRemove, setConfirmRemove] = React.useState<Account | undefined>()
	const [renameAccount, setRenameAccount] = React.useState<Account | undefined>()
	const [changePassword, setChangePassword] = React.useState(false)
	const [renameNew, setRenameNew] = React.useState("")
	const [revealAccount, setRevealAccount] = React.useState<LocalAccount | undefined>()
	const [modifyMultiSig, setModifyMultiSig] = React.useState<MultiSigAccount | undefined>()
	const selectedAccount = props.selectedAccount

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
	const handleChangePassword = (oldPassword: string, newPassword: string) => {
		props.onChangePassword(oldPassword, newPassword)
		setChangePassword(false)
	}
	const handleCancel = () => {
		setOpenedAdd(undefined)
		setConfirmRemove(undefined)
		setRevealAccount(undefined)
		setModifyMultiSig(undefined)
		setChangePassword(false)
	}
	const handleRefetch = () => { props.onAdd() }

	const handleBackup = () => {
		shell.showItemInFolder(accountsDBFilePath())
	}
	const forceSetupPassword = !props.hasPassword && (openedAdd === "create-local" || openedAdd === "import-local")
	const canCreateMultiSig = selectedAccount && selectedAccount.type !== "address-only"
	const canImportMultiSig = !!props.accounts.find((a) => a.type !== "address-only")
	return (
		<AppContainer>
			{confirmRemove && <ConfirmRemove account={confirmRemove} onRemove={handleRemove} onCancel={handleCancel} />}
			{(changePassword || forceSetupPassword) && <ChangePassword
				hasPassword={props.hasPassword}
				onChangePassword={handleChangePassword}
				onClose={handleCancel} />}
			{(!forceSetupPassword && openedAdd === "create-local") && <CreateLocalAccount
				onAdd={handleAdd}
				onCancel={handleCancel}/>}
			{(!forceSetupPassword && openedAdd === "import-local") && <ImportLocalAccount
				onAdd={handleAdd}
				onCancel={handleCancel} />}
			{openedAdd === "add-ledger" && <AddLedgerAccount onAdd={handleAdd} onCancel={handleCancel} />}
			{openedAdd === "add-addressonly" && <AddAddressOnlyAccount onAdd={handleAdd} onCancel={handleCancel} />}
			{openedAdd === "create-multisig" && selectedAccount &&
			<CreateMultiSigAccount
				selectedAccount={selectedAccount}
				runTXs={props.runTXs}
				onAdd={handleAdd}
				onCancel={handleCancel}
			/>}
			{revealAccount && <RevealLocalKey account={revealAccount} onClose={handleCancel} />}
			{modifyMultiSig && <ModifyMultiSig
				account={modifyMultiSig}
				accounts={props.accounts}
				onClose={handleCancel}
				onChangeOwner={(newOwner) => {
					const modifiedAccount = {
						...modifyMultiSig,
						ownerAddress: newOwner,
					}
					props.onAdd(modifiedAccount, undefined, true)
				}}
			/>}

			<AppHeader app={Accounts} refetch={handleRefetch} isFetching={false} />
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
								<AccountIcon type={a.type} />
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
								<Tooltip title={
									"Show the secret mnemonic phrase and the private-key of " +
									"this account. Never share these secrets with anyone else!"}>
									<IconButton
										edge="end"
										color="secondary" onClick={() => setRevealAccount(a)}>
										<icons.Lock />
									</IconButton>
								</Tooltip>}
								{a.type === "multisig" &&
								<Tooltip title={"Change associated owner for this MultiSig account"}>
									<IconButton
										edge="end"
										onClick={() => setModifyMultiSig(a)}>
										<icons.Settings />
									</IconButton>
								</Tooltip>}
								<Tooltip title="Remove account">
									<IconButton
										edge="end"
										color="secondary" onClick={() => setConfirmRemove(a)}>
										<icons.Delete />
									</IconButton>
								</Tooltip>
								</Box>
							</Paper>
						</Box>
					)})
				}
			</Box>
			<AppSection>
				<Button
					color="primary"
					variant="outlined"
					startIcon={<AccountIcon type="local" />}
					onClick={() => { setOpenedAdd("create-local") }}>Create Local Account</Button>
				<Button
					className={classes.buttonAdd}
					color="primary"
					variant="outlined"
					startIcon={<icons.GetApp />}
					onClick={() => { setOpenedAdd("import-local") }}>Import Local Account</Button>
				<Button
					className={classes.buttonAdd}
					color="primary"
					variant="outlined"
					startIcon={<AccountIcon type="ledger" />}
					onClick={() => { setOpenedAdd("add-ledger") }}>Add Ledger Account</Button>
				<Button
					className={classes.buttonAdd}
					color="primary"
					variant="outlined"
					startIcon={<AccountIcon type="address-only" />}
					onClick={() => { setOpenedAdd("add-addressonly") }}>Add ReadOnly Account</Button>
				<Button
					className={classes.buttonAdd}
					color="primary"
					variant="outlined"
					startIcon={<AccountIcon type="multisig" />}
					disabled={!canCreateMultiSig}
					onClick={() => { setOpenedAdd("create-multisig") }}>Create MultiSig Account</Button>
				<Button
					className={classes.buttonAdd}
					color="primary"
					variant="outlined"
					startIcon={<AccountIcon type="multisig" />}
					disabled={!canImportMultiSig}
					onClick={() => { setOpenedAdd("import-multisig") }}>Import MultiSig Account</Button>
			</AppSection>
			<AppSection>
				<Box display="flex" flexDirection="row">
					<Box display="flex" flexDirection="column" flex={1} marginRight={1}>
						<Button
							color="secondary"
							variant="outlined"
							startIcon={<icons.LockOpen />}
							onClick={ () => { setChangePassword(true) } }
							>{props.hasPassword ? "Change" : "Setup"} Password</Button>
					</Box>
					<Box display="flex" flexDirection="column" flex={1} marginLeft={1}>
						<Button
							color="secondary"
							variant="outlined"
							startIcon={<icons.Backup />}
							onClick={handleBackup}
							>Backup Database</Button>
					</Box>
				</Box>
			</AppSection>
		</AppContainer>
	)
}
export default AccountsApp
