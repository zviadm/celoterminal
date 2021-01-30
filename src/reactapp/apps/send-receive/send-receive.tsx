import * as React from 'react'
import { CeloContract, ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { isValidAddress } from 'ethereumjs-util'

import { makeStyles } from '@material-ui/core/styles'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Typography from '@material-ui/core/Typography'
import AppHeader from '../../components/app-header'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'

import { Account } from '../../state/accounts'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtAmount } from '../../../common/utils'
import ERC20 from './erc20'
import { CFG } from '../../../common/cfg'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'

const useStyles = makeStyles(() => ({
	root: {
		display: "flex",
		flexDirection: "column",
		flex: 1,
	},
	card: {
		marginTop: 10,
		alignSelf: "flex-start",
	},
}))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	onError: (e: Error) => void,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [erc20, setErc20] = useLocalStorageState(
		"terminal/send-receive/erc20", CFG.erc20s[0].name)
	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		const contract = await newERC20(kit, erc20)
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
		const contract = await newERC20(kit, erc20)
		const tx = contract.transfer(
			toAddress, new BigNumber(toSend).multipliedBy(1e18))
		return [{tx: tx}]
	}
	const handleSend = () => { runTXs(txsSend) }
	return (
		<div className={classes.root}>
			<AppHeader title={"Send/Receive"} isFetching={isFetching} refetch={refetch} />
			<Paper className={classes.card}>
				<Select
					autoFocus
					label="ERC20"
					value={erc20}
					onChange={(event) => { setErc20(event.target.value as string) }}>
					{
						CFG.erc20s.map(({name}) => (
							<MenuItem value={name} key={name}>{name}</MenuItem>
						))
					}
				</Select>
				<Box marginTop={1}>
					<Typography>
						Balance: {!fetched ? "?" : fmtAmount(fetched.balance, fetched.decimals)} {erc20}
					</Typography>
				</Box>
			</Paper>
			<Card className={classes.card}>
				<CardContent>
					<div style={{display: "flex", flexDirection: "column", width: 400}}>
						<TextField
								margin="normal"
								label={`Destination address`}
								value={toAddress}
								placeholder="0x..."
								size="medium"
								fullWidth={true}
								inputProps={{style: {fontFamily: "monospace"}, spellCheck: false}}
								onChange={(e) => { setToAddress(e.target.value) }}
							/>
						<TextField
								autoFocus
								margin="normal"
								label={
									!fetched ? `Amount` :
									`Amount (max: ${fmtAmount(fetched.balance, fetched.decimals)})`
								}
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
				</CardContent>
			</Card>
		</div>
	)
}
export default SendReceiveApp

const newERC20 = async (kit: ContractKit, name: string, address?: string) => {
	switch (name) {
	case "CELO":
		address = await kit.registry.addressFor(CeloContract.GoldToken)
		break
	case "cUSD":
		address = await kit.registry.addressFor(CeloContract.StableToken)
		break
	}
	if (!address) {
		throw new Error(`Unknown ERC20: ${name} - ${address}!`)
	}
	return new ERC20(kit, address)
}