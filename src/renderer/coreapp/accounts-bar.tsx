import { Account } from '../../lib/accounts'
import { fmtAddress } from '../../lib/utils'

import * as React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'

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
	return (
		<Box display="flex" flexDirection="row" justifyContent="flex-end" p={2}>
			<Box display="flex" flexDirection="row" flex={1}>
				<NetworkIndicator />
			</Box>
			<Select
				id="accounts-select"
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
		</Box>
	)
}
export default AccountsBar