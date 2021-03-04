import { clipboard } from 'electron'
import QRCode from 'qrcode-svg'

import { Account } from '../../lib/accounts'
import { fmtAddress } from '../../lib/utils'
import { encodeDataForQr } from '../../lib/celo-qr-code'

import * as React from 'react'
import {
	makeStyles, IconButton, Select, MenuItem, Box, Typography,
	Tooltip, Dialog, DialogContent, Paper
} from '@material-ui/core'
import { CropFree, FileCopy } from '@material-ui/icons'

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
	return (
		<Box display="flex" flexDirection="row" justifyContent="flex-end" p={2}>
			<Box display="flex" flexDirection="row" flex={1}>
				<NetworkIndicator />
			</Box>
			<Select
				id="accounts-select"
				style={{marginRight: 5}}
				value={props.selectedAccount?.address || ""}
				onChange={(event) => {
					const selected = props.accounts.find((a) => a.address === event.target.value)
					if (selected) {
						props.onSelectAccount(selected)
					}
				}}>
				{
					props.accounts.map((a) => (
						<MenuItem value={a.address} key={a.address}>
							<Box display="flex" alignItems="center">
								<Box display="flex" alignSelf="flex-end" marginRight={1}>
									<AccountIcon
										type={a.type}
										style={a.type === "ledger" ? {paddingRight: 5} : undefined}
										/>
								</Box>
								<Typography className={classes.name}>{a.name}</Typography>
								<Typography className={classes.address}>{fmtAddress(a.address)}</Typography>
							</Box>
						</MenuItem>
					))
				}
			</Select>
			<CopyAddressButton address={props.selectedAccount?.address} />
			<QRCodeButton address={props.selectedAccount?.address} />
		</Box>
	)
}
export default AccountsBar

const CopyAddressButton = (props: {
	address?: string,
}) => {
	const [copied, setCopied] = React.useState(false)
	const handleCopyAddress = () => {
		if (!props.address) {
			return
		}
		clipboard.writeText(props.address)
		setCopied(true)
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