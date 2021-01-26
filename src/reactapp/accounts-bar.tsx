import * as React from 'react'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Box from '@material-ui/core/Box'

import { Account } from '../common/accounts'

const AccountsBar = (props: {
	accounts: Account[],
	selectedAccount: Account,
	setSelectedAccount: (a: Account) => void,
}): JSX.Element => {
	return (
		<Box
			style={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}
			px={2}
			>
			<Select
				value={props.selectedAccount.address}
				onChange={(event) => {
					const selected = props.accounts.find((a) => a.address === event.target.value)
					if (selected) {
						props.setSelectedAccount(selected)
					}
				}}>
				{
					props.accounts.map((a) => (
						<MenuItem value={a.address} key={a.address}>
							{`${a.name}: ${a.address.slice(0,6)}...${a.address.slice(a.address.length-4)}`}
						</MenuItem>
					))
				}
			</Select>
		</Box>
	)
}

export default AccountsBar