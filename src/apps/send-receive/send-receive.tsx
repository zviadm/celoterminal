import * as React from 'react'
import { ContractKit } from '@celo/contractkit'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'

import { Account } from '../../state/accounts-state'
import useGlobalState from '../../state/global-state'
import useOnChainState from '../../state/onchain-state'
import Button from '@material-ui/core/Button'
import { CancelPromise, sleep } from '../../utils'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const sendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
}): JSX.Element => {
	const [erc20, setErc20] = useGlobalState("terminal/send-receive/erc20", "CELO")
	const {
		isFetching,
		fetched,
		fetchError,
		refetch,
	} = useOnChainState(async (kit: ContractKit, c: CancelPromise) => {
		const goldToken = await kit.contracts.getGoldToken()
		const balance = await goldToken.balanceOf(props.selectedAccount.address)
		return balance
	}, [props.selectedAccount.address])
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

			<div>
				<p>{isFetching ? "fetching..." : fetched.div(1e18).toFixed(4) || fetchError.toString()}
				</p>
			</div>
			<Button onClick={() => { refetch() }} >
				REFETCH
			</Button>
		</div>
	)
}
