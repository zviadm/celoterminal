import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { isValidAddress } from 'ethereumjs-util'
import { BlockTransactionString } from 'web3-eth'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'

import { Account } from '../../../lib/accounts/accounts'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtAmount } from '../../../lib/utils'
import { newErc20 } from '../../../lib/erc20/erc20-contract'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { SendReceive } from './def'
import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'
import { useErc20List } from '../../state/erc20list-state'
import { RegisteredErc20 } from '../../../lib/erc20/core'

import * as React from 'react'
import {
	Select, MenuItem, Typography, Button, Box, IconButton,
	ListItemText, ListItemSecondaryAction,
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import { Close, Search } from '@material-ui/icons'

import AddressAutocomplete from '../../components/address-autocomplete'
import AppHeader from '../../components/app-header'
import TransferHistory from './transfer-history'
import NumberInput from '../../components/number-input'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import AddErc20 from '../../components/add-erc20'
import RemoveErc20 from '../../components/remove-erc20'

const SendReceiveApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const erc20List = useErc20List()
	const [_erc20Symbol, setErc20Symbol] = useLocalStorageState(
		"terminal/send-receive/erc20", erc20List.erc20s[0].symbol)
	const erc20 = erc20List.erc20s.find((e) => e.symbol === _erc20Symbol) || erc20List.erc20s[0]
	if (erc20.symbol !== _erc20Symbol) {
		setErc20Symbol(erc20.symbol)
	}

	const [showAddToken, setShowAddToken] = React.useState(false)
	const [toRemove, setToRemove] = React.useState<RegisteredErc20 | undefined>()

	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const contract = await newErc20(kit, erc20)
			const balance = contract.balanceOf(selectedAddress)
			return {
				balance: await balance,
			}
		},
		[selectedAddress, erc20]
	))
	const transferHistory = useEventHistoryState(React.useCallback(
		async (kit: ContractKit, fromBlock: number, toBlock: number, latestBlock: BlockTransactionString) => {
			const contractDirect = (await newErc20(kit, erc20)).web3contract
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
		const contract = await newErc20(kit, erc20)
		const tx = contract.transfer(
			toAddress, new BigNumber(toSend).shiftedBy(erc20.decimals))
		return [{tx: tx}]
	}
	const handleSend = () => { runTXs(txsSend) }
	const canSend = (
		isValidAddress(toAddress) && (toSend !== "") &&
		fetched &&
		fetched.balance.gte(new BigNumber(toSend).shiftedBy(erc20.decimals)))
	// TODO(zviadm): erc20 should be compared against current `feeCurrency` instead.
	const maxToSend = fetched && (
		erc20.symbol === "CELO" ?
			BigNumber.maximum(
				fetched.balance.shiftedBy(-erc20.decimals).minus(0.0001), 0) :
			fetched.balance.shiftedBy(-erc20.decimals))
	return (
		<AppContainer>
			<AppHeader app={SendReceive} isFetching={isFetching || transferHistory.isFetching} refetch={refetchAll} />
			{showAddToken &&
			<AddErc20
				onCancel={() => { setShowAddToken(false) }}
				onAdd={(erc20) => {
					setShowAddToken(false)
					erc20List.reload()
					setErc20Symbol(erc20.symbol)
				}}
			/>}
			{toRemove &&
			<RemoveErc20
				toRemove={toRemove}
				onCancel={() => { setToRemove(undefined) }}
				onRemove={() => {
					setToRemove(undefined)
					erc20List.reload()
				}}
			/>}
			<AppSection>
				<Select
					id="erc20-select"
					autoFocus
					label="Token"
					value={erc20.symbol}
					onChange={(event) => {
						if (event.target.value === "add-token") {
							setShowAddToken(true)
						} else {
							setErc20Symbol(event.target.value as string)
						}
					}}>
					{
						erc20List.erc20s.map((erc20) => {
							return (
								<MenuItem
									key={erc20.address || erc20.symbol}
									id={`erc20-${erc20.symbol}-item`}
									value={erc20.symbol}>
									<ListItemText
										primary={erc20.symbol}
										secondary={erc20.name}
									/>
									{erc20.address !== "" &&
									<ListItemSecondaryAction>
										<IconButton
											id={`remove-token-${erc20.symbol}`}
											size="small"
											onClick={(event) => {
												setToRemove(erc20)
												event.stopPropagation()
											}}>
											<Close />
										</IconButton>
									</ListItemSecondaryAction>}
								</MenuItem>
							)
						})
					}
					<MenuItem id="add-token" value="add-token">
						<Box display="flex" flexDirection="row" alignItems="center">
							<Typography
								style={{fontStyle: "italic"}}
								color="textSecondary">Search...</Typography>
							<Search style={{marginLeft: 5}} />
						</Box>
					</MenuItem>
				</Select>
				<Box marginTop={1}>
					<Typography>
						Balance: {!fetched ? "?" : fmtAmount(fetched.balance, erc20.decimals)} {erc20.symbol}
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
						`Amount (max: ${fmtAmount(fetched.balance, erc20.decimals)})`
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
					erc20={erc20}
					/>
			</AppSection>
		</AppContainer>
	)
}
export default SendReceiveApp
