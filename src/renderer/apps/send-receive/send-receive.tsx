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
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Alert from '@material-ui/lab/Alert'
import Autocomplete from '@material-ui/lab/Autocomplete'

import { Account } from '../../../lib/accounts'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtAmount } from '../../../lib/utils'
import ERC20 from './erc20'
import { CFG } from '../../../lib/cfg'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { SendReceive } from './def'

const useStyles = makeStyles(() => ({
	address: {
		fontFamily: "monospace",
	},
}))

const SendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const classes = useStyles()
	const erc20s = CFG().erc20s
	const [erc20, setErc20] = useLocalStorageState(
		"terminal/send-receive/erc20", erc20s[0].name)
	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const contract = await newERC20(kit, erc20)
			const decimals = contract.decimals()
			const balance = contract.balanceOf(selectedAddress)
			return {
				decimals: await decimals,
				balance: await balance,
			}
		},
		[selectedAddress, erc20]
	))
	const [toSend, setToSend] = React.useState("")
	const [toAddress, setToAddress] = React.useState("")

	const runTXs = (f: TXFunc) => {
		props.runTXs(f, (e?: Error) => {
			refetch()
			if (!e) {
				setToSend("")
			}
		})
	}
	const txsSend = async (kit: ContractKit) => {
		if (!fetched?.decimals) {
			throw new Error(`Unknown decimals for ERC20: ${erc20}.`)
		}
		const contract = await newERC20(kit, erc20)
		const tx = contract.transfer(
			toAddress, new BigNumber(toSend).shiftedBy(fetched.decimals))
		return [{tx: tx}]
	}
	const handleSend = () => { runTXs(txsSend) }
	const canSend = (
		isValidAddress(toAddress) && (toSend !== "") &&
		fetched &&
		fetched.balance.gte(new BigNumber(toSend).shiftedBy(fetched.decimals)))
	const toAddresses = props.accounts.map((a) => ({
		address: a.address,
		account: a,
	}))
	const renderOption = (o: {account?: Account, address: string}) => (
		<React.Fragment>
			<Typography className={classes.address}>{o.account?.name}: {o.address}</Typography>
		</React.Fragment>
	)
	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader title={SendReceive.title} isFetching={isFetching} refetch={refetch} />
			<Box marginTop={2}>
				<Paper>
					<Box p={2}>
						<Select
							autoFocus
							label="ERC20"
							value={erc20}
							onChange={(event) => { setErc20(event.target.value as string) }}>
							{
								erc20s.map(({name}) => (
									<MenuItem value={name} key={name}>{name}</MenuItem>
								))
							}
						</Select>
						<Box marginTop={1}>
							<Typography>
								Balance: {!fetched ? "?" : fmtAmount(fetched.balance, fetched.decimals)} {erc20}
							</Typography>
						</Box>
					</Box>
				</Paper>
			</Box>
			<Box marginTop={2}>
				<Paper>
					<Box display="flex" flexDirection="column" p={2}>
						<Alert severity="warning">
							Transfers are non-reversible. Transfering funds to an incorrect address
							can lead to permanent loss of your funds.
						</Alert>
						<Autocomplete
							freeSolo
							autoSelect
							options={toAddresses}
							renderOption={renderOption}
							getOptionLabel={(o) => o?.address || "" }
							getOptionSelected={(o, v) => { return o.address === v.address }}
							renderInput={(params) => (
								<TextField
									{...params}
									margin="normal"
									label={`Destination address`}
									placeholder="0x..."
									size="medium"
									fullWidth={true}
									spellCheck={false}
									inputProps={{
										...params.inputProps,
										className: classes.address,
									}}
								/>
							)}
							inputValue={toAddress}
							onInputChange={(e, value, reason) => {
								if (reason !== "reset" || value !== "") {
									setToAddress(value)
								}
								return value
							}}
							/>
						<TextField
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
							disabled={!canSend}
							onClick={handleSend}>Send</Button>
					</Box>
				</Paper>
			</Box>
		</Box>
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