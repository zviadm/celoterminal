import * as React from 'react'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/Button'

import { Account } from '../../state/accounts-state'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'

interface Erc20Contract {
	balanceOf(address: string): Promise<BigNumber>
}

const erc20s = [
	{
		name: "CELO",
		contract: (kit: ContractKit): Promise<Erc20Contract> => {
			return kit.contracts.getGoldToken()
		},
	},
	{
		name: "cUSD",
		contract: (kit: ContractKit): Promise<Erc20Contract> => {
			return kit.contracts.getStableToken()
		},
	},
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const SendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
}): JSX.Element => {
	const [erc20, setErc20] = useLocalStorageState("terminal/send-receive/erc20", erc20s[0].name)
	const {
		isFetching,
		fetched,
		fetchError,
		refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		const e = erc20s.find((e) => e.name === erc20)
		if (!e) {
			throw new Error("unreachable code!")
		}
		const contract = await e.contract(kit)
		const balance = await contract.balanceOf(props.selectedAccount.address)
		return balance
	}, [props.selectedAccount.address, erc20])
	return (
		<div>
			<div>
			<Select
				label="ERC20"
				value={erc20}
				onChange={(event) => { setErc20(event.target.value as string) }}>
				{
					erc20s.map((e) => (
						<MenuItem value={e.name} key={e.name}>{e.name}</MenuItem>
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
