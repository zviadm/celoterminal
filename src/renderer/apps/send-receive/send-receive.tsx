import { CeloContract, ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { isValidAddress } from 'ethereumjs-util'
import { BlockTransactionString } from 'web3-eth'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'

import { Account } from '../../../lib/accounts'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtAmount } from '../../../lib/utils'
import ERC20 from './erc20'
import { CFG } from '../../../lib/cfg'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { SendReceive } from './def'
import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'

import * as React from 'react'
import {
	Select, MenuItem, Typography, Button, Box
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import AddressAutocomplete from '../../components/address-autocomplete'
import AppHeader from '../../components/app-header'
import TransferHistory from './transfer-history'
import NumberInput from '../../components/number-input'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'

const SendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
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
	const transferHistory = useEventHistoryState(React.useCallback(
		async (kit: ContractKit, fromBlock: number, toBlock: number, latestBlock: BlockTransactionString) => {
			const contractDirect = (await newERC20(kit, erc20)).web3contract
			const fromTransfers = await contractDirect.getPastEvents("Transfer", {
				fromBlock,
				toBlock,
				filter: {from: selectedAddress},
			})
			const toTransfers = await contractDirect.getPastEvents("Transfer", {
				fromBlock,
				toBlock,
				filter: {to: selectedAddress},
			})
			const toTransfersFiltered = toTransfers.filter((e) => e.returnValues.from !== selectedAddress)
			const transfers = fromTransfers.concat(toTransfersFiltered)
			transfers.sort((a, b) => a.blockNumber - b.blockNumber)

			return transfers.map((e) => ({
				timestamp: estimateTimestamp(latestBlock, e.blockNumber),
				txHash: e.transactionHash,
				from: e.returnValues.from,
				to: e.returnValues.to,
				amount: valueToBigNumber(e.returnValues.value),
			}))
		},
		[selectedAddress, erc20],
	), {
		maxHistoryDays: 7,
		maxEvents: 100,
	})
	const [toSend, setToSend] = React.useState("")
	const [toAddress, setToAddress] = React.useState("")

	const refetchAll = () => {
		refetch()
		transferHistory.refetch()
	}

	const runTXs = (f: TXFunc) => {
		props.runTXs(f, (e?: Error) => {
			refetchAll()
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
	// TODO(zviadm): erc20 should be compared against current `feeCurrency` instead.
	const maxToSend = fetched && (
		erc20 === "CELO" ?
			BigNumber.maximum(
				fetched.balance.shiftedBy(-fetched.decimals).minus(0.0001), 0) :
			fetched.balance.shiftedBy(-fetched.decimals))
	return (
		<AppContainer>
			<AppHeader app={SendReceive} isFetching={isFetching || transferHistory.isFetching} refetch={refetchAll} />
			<AppSection>
				<Select
					id="erc20-select"
					autoFocus
					label="ERC20"
					value={erc20}
					onChange={(event) => { setErc20(event.target.value as string) }}>
					{
						erc20s.map(({name}) => (
							<MenuItem id={`erc20-${name}-item`} value={name} key={name}>{name}</MenuItem>
						))
					}
				</Select>
				<Box marginTop={1}>
					<Typography>
						Balance: {!fetched ? "?" : fmtAmount(fetched.balance, fetched.decimals)} {erc20}
					</Typography>
				</Box>
			</AppSection>
			<AppSection>
				<Alert severity="warning">
					Transfers are non-reversible. Transfering funds to an incorrect address
					can lead to permanent loss of your funds.
				</Alert>
				<AddressAutocomplete
					id="to-address-input"
					textFieldProps={{
						label: "Destination address",
						margin: "normal",
						InputLabelProps: {shrink: true},
					}}
					addresses={props.accounts}
					address={toAddress}
					onChange={setToAddress}
				/>
				<NumberInput
					margin="normal"
					id="amount-input"
					label={
						!fetched ? `Amount` :
						`Amount (max: ${fmtAmount(fetched.balance, fetched.decimals)})`
					}
					InputLabelProps={{shrink: true}}
					value={toSend}
					onChangeValue={setToSend}
					maxValue={maxToSend}
				/>
				<Button
					id="send"
					variant="outlined" color="primary"
					disabled={!canSend}
					onClick={handleSend}>Send</Button>
			</AppSection>
			<AppSection>
				<TransferHistory
					address={selectedAddress}
					events={transferHistory.fetched}
					erc20={fetched && {
						name: erc20,
						decimals: fetched.decimals,
					}}
					/>
			</AppSection>
		</AppContainer>
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