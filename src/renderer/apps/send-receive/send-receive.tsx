import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
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
	Typography, Box, Tab
} from '@material-ui/core'
import TabContext from '@material-ui/lab/TabContext'
import TabPanel from '@material-ui/lab/TabPanel'
import TabList from '@material-ui/lab/TabList'

import AppHeader from '../../components/app-header'
import TransferHistory from './transfer-history'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import AddErc20 from '../../components/add-erc20'
import RemoveErc20 from '../../components/remove-erc20'
import SelectErc20 from './select-erc20'
import TransferTab from './transfer-tab'

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
	const [tab, setTab] = React.useState("transfer")

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
	const approvalState = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const contract = await newErc20(kit, erc20)
			// TODO(zviad): This might need to be batched up, if there are too many events.
			const spenderEvents = await contract.web3contract.getPastEvents(
				"Approval", {fromBlock: 0, filter: {owner: selectedAddress}})
			const spenders: Set<string> = new Set(spenderEvents.map((e) => e.returnValues.spender))
			const ownerEvents = await contract.web3contract.getPastEvents(
				"Approval", {fromBlock: 0, filter: {spender: selectedAddress}})
			const owners: Set<string> = new Set(ownerEvents.map((e) => e.returnValues.owner))
			return {
				spenders,
				owners,
			}
		},
		[selectedAddress, erc20],
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

	const refetchAll = () => {
		refetch()
		approvalState.refetch()
		transferHistory.refetch()
	}

	const runTXs = (f: TXFunc) => {
		props.runTXs(f, () => { refetchAll() })
	}
	const handleSend = (toAddress: string, toSend: string) => {
		runTXs(
			async (kit: ContractKit) => {
				const contract = await newErc20(kit, erc20)
				const tx = contract.transfer(
					toAddress, new BigNumber(toSend).shiftedBy(erc20.decimals))
				return [{tx: tx}]
			}
		)
	}
	// TODO(zviadm): erc20 should be compared against current `feeCurrency` instead.
	const estimatedGas = erc20.symbol === "CELO" ? new BigNumber(0.0001).shiftedBy(erc20.decimals) : 0
	const maxToSend = fetched && BigNumber.maximum(fetched.balance.minus(estimatedGas), 0)
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
				<SelectErc20
					erc20s={erc20List.erc20s}
					selected={erc20}
					onSelect={(e) => { setErc20Symbol(e.symbol) }}
					onRemoveToken={setToRemove}
					onAddToken={() => { setShowAddToken(true) }}
				/>
				<Box marginTop={1}>
					<Typography>
						Balance: {!fetched ? "?" : fmtAmount(fetched.balance, erc20.decimals)} {erc20.symbol}
					</Typography>
				</Box>
			</AppSection>

			<TabContext value={tab}>
				<AppSection innerPadding={0}>
					<TabList onChange={(e, v) => { setTab(v) }}>
						<Tab label="Transfer" value={"transfer"} />
						<Tab label="Transfer From" value={"transfer-from"} />
						<Tab label="Approvals" value={"approvals"} />
					</TabList>
					<TabPanel value="transfer">
						<TransferTab
							erc20={erc20}
							balance={fetched?.balance}
							maxToSend={maxToSend}
							addressBook={props.accounts}
							onSend={handleSend}
						/>
					</TabPanel>
				</AppSection>
			</TabContext>
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
