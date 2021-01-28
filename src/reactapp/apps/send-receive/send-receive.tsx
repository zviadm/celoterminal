import * as React from 'react'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { isValidAddress } from 'ethereumjs-util'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Typography from '@material-ui/core/Typography'
import AppHeader from '../../components/app-header'
import Box from '@material-ui/core/Box'

import { Account } from '../../state/accounts'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtAmount } from '../../../common/utils'
import ERC20 from './erc20'
import { CFG } from '../../../common/cfg'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { TextField } from '@material-ui/core'
import Button from '@material-ui/core/Button'

const newERC20 = (kit: ContractKit, name: string) => {
	const erc20address = CFG.erc20s[name]
	if (!erc20address) {
		throw new Error(`Unknown ERC20: ${name}`)
	}
	return new ERC20(kit, erc20address)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const SendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	onError: (e: Error) => void,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [erc20, setErc20] = useLocalStorageState(
		"terminal/send-receive/erc20", Object.keys(CFG.erc20s)[0])
	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		const contract = newERC20(kit, erc20)
		const decimals = contract.decimals()
		const balance = contract.balanceOf(selectedAddress)
		return {
			decimals: await decimals,
			balance: await balance,
		}
	}, [selectedAddress, erc20], props.onError)
	const [toSend, setToSend] = React.useState("")
	const [toAddress, setToAddress] = React.useState("")

	const runTXs = (f: TXFunc) => { props.runTXs(f, () => { refetch() }) }
	const txsSend = async (kit: ContractKit) => {
		if (!isValidAddress(toAddress)) {
			throw new Error(`Invalid destination address: ${toAddress}.`)
		}
		const contract = newERC20(kit, erc20)
		const tx = contract.transfer(toAddress, new BigNumber(toSend).multipliedBy(1e18))
		return [{tx: tx}]
	}
	const handleSend = () => { runTXs(txsSend) }
	return (
		<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
			<AppHeader title={"Send/Receive"} isFetching={isFetching} refetch={refetch} />
			{fetched &&
			<div>
				<Box p={2}>
					<Select
						autoFocus
						label="ERC20"
						value={erc20}
						onChange={(event) => { setErc20(event.target.value as string) }}>
						{
							Object.keys(CFG.erc20s).map((name) => (
								<MenuItem value={name} key={name}>{name}</MenuItem>
							))
						}
					</Select>
					<Typography>
						Balance: {fmtAmount(fetched.balance, fetched.decimals)} {erc20}
					</Typography>
				</Box>
				<Box p={2}>
					<div style={{display: "flex", flexDirection: "column", width: 400}}>
						<TextField
								margin="dense"
								label={`Destination address`}
								variant="outlined"
								value={toAddress}
								placeholder="0x..."
								size="medium"
								fullWidth={true}
								inputProps={{style: {fontFamily: "monospace"}, spellCheck: false}}
								onChange={(e) => { setToAddress(e.target.value) }}
							/>
						<TextField
								autoFocus
								margin="dense"
								label={`Amount (max: ${fmtAmount(fetched.balance, fetched.decimals)})`}
								variant="outlined"
								value={toSend}
								size="medium"
								type="number"
								fullWidth={true}
								onChange={(e) => { setToSend(e.target.value) }}
							/>
						<Button
							variant="outlined" color="primary"
							onClick={handleSend}>Send</Button>
					</div>
				</Box>
			</div>}
		</div>
	)
}
