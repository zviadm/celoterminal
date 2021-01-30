import * as React from 'react'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'
import { AddressOnlyAccountIcon, LedgerAccountIcon, LocalAccountIcon } from './accounts-app/account-icons'

import { Account } from '../state/accounts'
import { fmtAddress } from '../../common/utils'

const AccountsBar = (props: {
	accounts: Account[],
	selectedAccount?: Account,
	onSelectAccount: (a: Account) => void,
}): JSX.Element => {
	return (
		<Box
			p={2}
			style={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}
			>
			<Select
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
							<div style={{display: "flex", alignItems: "center"}}>
								<div style={{marginRight: 5, display: "flex", alignSelf: "end"}}>
								{
								a.type === "local" ? <LocalAccountIcon /> :
								a.type === "ledger" ? <LedgerAccountIcon style={{paddingRight: 5}} /> :
								a.type === "address-only" ? <AddressOnlyAccountIcon /> : <></>
								}
								</div>
								<Typography style={{
									width: 120,
									fontFamily: "monospace",
									textOverflow: "ellipsis",
									overflow: "hidden",
									marginRight: 20,
									}}>{a.name}</Typography>
								<Typography style={{fontFamily: "monospace"}}>
									{fmtAddress(a.address)}
								</Typography>
							</div>
						</MenuItem>
					))
				}
			</Select>
		</Box>
	)
}

export default AccountsBar