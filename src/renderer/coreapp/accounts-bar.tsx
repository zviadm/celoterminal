import { clipboard, shell } from 'electron'
import QRCode from 'qrcode-svg'

import { Account } from '../../lib/accounts/accounts'
import { fmtAddress } from '../../lib/utils'
import { encodeDataForQr } from '../../lib/celo-qr-code'
import { explorerRootURL } from '../../lib/cfg'

import * as React from 'react'
import {
	makeStyles, IconButton, Select, MenuItem, Box, Typography,
	Tooltip, Dialog, DialogContent, Paper
} from '@material-ui/core'
import CropFree from '@material-ui/icons/CropFree'
import FileCopy from '@material-ui/icons/FileCopy'
import OpenInNew from '@material-ui/icons/OpenInNew'

import AccountIcon from './accounts-app/account-icon'
import NetworkIndicator from './network-indicator'

const useStyles = makeStyles(() => ({
	name: {
		width: 180,
		fontFamily: "monospace",
		textOverflow: "ellipsis",
		overflow: "hidden",
		marginRight: 20,
	},
	address: {
		fontFamily: "monospace",
	},
}))

const AccountsBar = (props: {
	accounts: Account[],
	selectedAccount?: Account,
	onSelectAccount: (a: Account) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [open, setOpen] = React.useState(false)
	return (
		<Box display="flex" flexDirection="row" justifyContent="flex-end" p={2}>
			<Box display="flex" flexDirection="row" flex={1}>
				<NetworkIndicator />
			</Box>
			<Select
				id="accounts-select"
				style={{marginRight: 5}}
				value={props.selectedAccount?.address || ""}
				open={open}
				onOpen={() => { setOpen(true) }}
				onClose={() => { setOpen(false) }}
				onChange={(event) => {
					const selected = props.accounts.find((a) => a.address === event.target.value)
					if (selected) {
						props.onSelectAccount(selected)
					}
				}}>
				{
					props.accounts.map((a, idx) => (
						<MenuItem id={`select-account-${idx}-item`} value={a.address} key={a.address}>
							<Box display="flex" alignItems="center">
								<Box display="flex" alignSelf="flex-end"
									marginRight={1}
									paddingLeft={open ? 0 : 1}>
									<AccountIcon
										type={a.type}
										style={a.type === "ledger" ? {paddingRight: 5} : undefined}
										/>
								</Box>
								<Typography className={classes.name}>{a.name}</Typography>
								<Typography className={classes.address}>{fmtAddress(a.address)}</Typography>
								<Box
									display="flex"
									marginLeft={open ? 1 : 0}
									visibility={open ? "visible" : "hidden"}
									width={open ? "auto" : "0px"}>
									<CopyAddressButton address={a.address} />
									<OpenInExplorerButton address={a.address} />
								</Box>
							</Box>
						</MenuItem>
					))
				}
			</Select>
			<CopyAddressButton id="copy-selected-account-address" address={props.selectedAccount?.address} />
			<QRCodeButton address={props.selectedAccount?.address} />
			<OpenInExplorerButton address={props.selectedAccount?.address} />
		</Box>
	)
}
export default AccountsBar

const CopyAddressButton = (props: {
	id?: string,
	address?: string,
}) => {
	const [copied, setCopied] = React.useState(false)
	const handleCopyAddress = (event: React.MouseEvent<HTMLElement>) => {
		if (!props.address) {
			return
		}
		clipboard.writeText(props.address)
		setCopied(true)
		event.stopPropagation()
	}
	const resetCopied = () => {
		if (copied) {
			setCopied(false)
		}
	}
	return (
		<Tooltip
			title={copied ? "Copied" : "Copy Address"}
			onClose={resetCopied}>
			<IconButton
				id={props.id}
				size="small"
				onClick={handleCopyAddress}
				disabled={!props.address}
				><FileCopy /></IconButton>
		</Tooltip>
	)
}

const QRCodeButton = (props: {
	address?: string,
}) => {
	const [open, setOpen] = React.useState(false)
	const address = props.address

	let svg: string | undefined
	if (open && address) {
		const url = encodeDataForQr({ address: address })
		svg = new QRCode({
			content: url,
			width: 512,
			height: 512,
			padding: 0,
			container: "svg-viewbox",
		}).svg()
	}
	const handleOpen = () => { setOpen(true) }
	const handleClose = () => { setOpen(false) }
	return (<>
		{svg &&
		<Dialog open={open} onClose={handleClose}>
			<DialogContent>
				<Box display="flex" flexDirection="column" alignItems="center">
					<Box width={250} height={250} margin={2}>
						<div
							ref={(nodeElement) => {
								if (nodeElement && svg) {
									nodeElement.innerHTML = svg
								}
							}}
						/>
					</Box>
					<Paper>
						<Box p={2} display="flex" flexDirection="column" alignItems="center">
							<Typography color="textSecondary">Account Address</Typography>
							<Typography style={{fontFamily: "monospace", fontSize: 20}}>
								{address?.slice(2, 6)} {address?.slice(6, 10)} {address?.slice(10, 14)} {address?.slice(14, 18)} {address?.slice(18, 22)}
							</Typography>
							<Typography style={{fontFamily: "monospace", fontSize: 20}}>
								{address?.slice(22, 26)} {address?.slice(26, 30)} {address?.slice(30, 34)} {address?.slice(34, 38)} {address?.slice(38)}
							</Typography>
						</Box>
					</Paper>
				</Box>
			</DialogContent>
		</Dialog>}
		<Tooltip title="QR Code">
			<IconButton
				size="small"
				onClick={handleOpen}
				disabled={!address}
				><CropFree /></IconButton>
		</Tooltip>
	</>)
}

const OpenInExplorerButton = (props: {address?: string}) => {
	return (
		<Tooltip title="Open in Explorer">
			<IconButton
				size="small"
				onClick={(event) => {
					shell.openExternal(`${explorerRootURL()}/address/${props.address}`)
					event.stopPropagation()
				}}
				disabled={!props.address}
				><OpenInNew /></IconButton>
		</Tooltip>
	)
}