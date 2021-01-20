import * as React from 'react'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'

import { Account } from '../../state/accounts-state'
import useGlobalState from '../../state/global-state'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const sendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
}): JSX.Element => {
	const [erc20, setErc20] = useGlobalState("terminal/send-receive/erc20", "CELO")
	return (
		<div>
			<div>
			<Select
				label="ERC20"
				value={erc20}
				onChange={(event) => { setErc20(event.target.value as string) }}>
				{
					["CELO", "cUSD"].map((a) => (
						<MenuItem value={a} key={a}>{a}</MenuItem>
					))
				}
			</Select>
			</div>

			<div>Acct: {props.selectedAccount.address}</div>
		</div>
	)
}