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
import ERC20 from './erc20'
import { CFG } from '../../../common/cfg'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const SendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	onError: (e: Error) => void,
}): JSX.Element => {
	const erc20s = CFG.erc20s
	const [erc20, setErc20] = useLocalStorageState("terminal/send-receive/erc20", Object.keys(erc20s)[0])
	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		const erc20address = erc20s[erc20]
		if (!erc20address) {
			throw new Error("unreachable code")
		}
		const contract = new ERC20(kit, erc20address)
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
							Object.keys(erc20s).map((name) => (
								<MenuItem value={name} key={name}>{name}</MenuItem>
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
