import * as React from 'react'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Typography from '@material-ui/core/Typography'
import AppHeader from '../../components/app-header'
import Box from '@material-ui/core/Box'

import { Account } from '../../state/accounts'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtCELOAmt } from '../../../common/utils'

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
	onError: (e: Error) => void,
}): JSX.Element => {
	const [erc20, setErc20] = useLocalStorageState("terminal/send-receive/erc20", erc20s[0].name)
	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		const e = erc20s.find((e) => e.name === erc20)
		if (!e) {
			throw new Error("unreachable code")
		}
		const contract = await e.contract(kit)
		const balance = await contract.balanceOf(selectedAddress)
		return {
			balance: balance,
		}
	}, [selectedAddress, erc20], props.onError)

	return (
		<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
			<AppHeader title={"Send/Receive"} isFetching={isFetching} refetch={refetch} />
			{fetched &&
			<div>
				<Box p={2}>
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
					<Typography>
						Balance: {fmtCELOAmt(fetched.balance)} {erc20}
					</Typography>
				</Box>
			</div>}
		</div>
	)
}
