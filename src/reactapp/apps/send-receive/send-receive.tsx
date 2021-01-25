import * as React from 'react'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/Button'
import LinearProgress from '@material-ui/core/LinearProgress'
import Typography from '@material-ui/core/Typography'

import { Account } from '../../../common/accounts'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtCELOAmt } from '../../utils'

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
		fetchError,
		refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		const e = erc20s.find((e) => e.name === erc20)
		if (!e) {
			throw new Error("unreachable code!")
		}
		const contract = await e.contract(kit)
		const balance = await contract.balanceOf(selectedAddress)
		return {
			balance: balance,
		}
	}, [selectedAddress, erc20])
	const onError = props.onError
	React.useEffect(() => {
		if (fetchError) {
			onError(fetchError)
		}
	}, [fetchError, onError])

	return (
		<div style={{display: "flex", flex: 1}}>
			{isFetching || <LinearProgress />}
			{fetched &&
			<div style={{display: "flex", flexDirection: "column"}}>
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
				<Button onClick={() => { refetch() }} >
					REFETCH
				</Button>
			</div>}
		</div>
	)
}
