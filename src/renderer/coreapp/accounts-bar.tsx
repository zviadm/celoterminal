import { clipboard } from 'electron'

import { Account } from '../../lib/accounts'
import { fmtAddress } from '../../lib/utils'

import * as React from 'react'
import {
	makeStyles, IconButton, Select, MenuItem, Box, Typography,
	Tooltip
} from '@material-ui/core'
import { CropFree, FileCopy } from '@material-ui/icons'

import { AddressOnlyAccountIcon, LedgerAccountIcon, LocalAccountIcon } from './accounts-app/account-icons'
import NetworkIndicator from './network-indicator'

const useStyles = makeStyles(() => ({
	name: {
		width: 120,
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
	const [copied, setCopied] = React.useState(false)
	const handleCopyAddress = () => {
		if (!props.selectedAccount) {
			return
		}
		clipboard.writeText(props.selectedAccount.address)
		setCopied(true)
	}
	const resetCopied = () => {
		if (copied) {
			setCopied(false)
		}
	}
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
								{
								a.type === "local" ? <LocalAccountIcon /> :
								a.type === "ledger" ? <LedgerAccountIcon style={{paddingRight: 5}} /> :
								a.type === "address-only" ? <AddressOnlyAccountIcon /> : <></>
								}
								</Box>
								<Typography className={classes.name}>{a.name}</Typography>
								<Typography className={classes.address}>{fmtAddress(a.address)}</Typography>
							</Box>
						</MenuItem>
					))
				}
			</Select>
			<Tooltip title={copied ? "Copied" : "Copy Address"} onClose={resetCopied}>
				<IconButton
					size="small"
					onClick={handleCopyAddress}
					><FileCopy /></IconButton>
			</Tooltip>
			<Tooltip title="QR Code">
				<IconButton
					size="small"
					><CropFree /></IconButton>
			</Tooltip>
		</Box>
	)
}
export default AccountsBar