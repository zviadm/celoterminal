import * as log from "electron-log"
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { BlockTransactionString } from 'web3-eth'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'

import { Account } from '../../../lib/accounts/accounts'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'
import { CancelPromise, fmtAmount } from '../../../lib/utils'
import { newErc20 } from '../../../lib/erc20/erc20-contract'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { SendReceive } from './def'
import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'
import { useErc20List } from '../../state/erc20list-state'
import { coreErc20Decimals } from '../../../lib/erc20/core'

import * as React from 'react'
import {
	Typography, Box, Tab,
} from '@material-ui/core'
import TabContext from '@material-ui/lab/TabContext'
import TabPanel from '@material-ui/lab/TabPanel'
import TabList from '@material-ui/lab/TabList'

import AppHeader from '../../components/app-header'
import TransferHistory from './transfer-history'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import TransferTab from './transfer-tab'
import TransferFromTab from './transfer-from-tab'
import ApprovalsTab from './approvals-tab'
import HiddenProgress from './hidden-progress'
import SelectErc20 from '../../components/select-erc20'

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
	const [tab, setTab] = useLocalStorageState("terminal/send-receive/tab", "transfer")
	const [resetAmounts, setResetAmounts] = React.useState(0)

	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const contract = await newErc20(kit, erc20)
			const balance = await contract.balanceOf(selectedAddress)
			let asCoreErc20
			if (erc20.conversion) {
				asCoreErc20 = await erc20.conversion(kit, erc20, balance)
			}
			return {
				balance,
				asCoreErc20,
			}
		},
		[selectedAddress, erc20]
	))
	const approvalData = useOnChainState(React.useCallback(
		async (kit: ContractKit, c: CancelPromise) => {
			const contract = await newErc20(kit, erc20)
			const spenders = new Set<string>()
			const owners = new Set<string>()

			const blockN = await kit.web3.eth.getBlockNumber()
			let incompleteBlockN: number | undefined
			const t0 = Date.now()
			const maxBatchSize = 30 * 17280
			let batchSize = 1000
			let prevDeltaMs
			for (let toBlock = blockN; toBlock > 0; ) {
				const startMs = Date.now()
				const fromBlock = Math.max(toBlock - batchSize, 0)
				log.info(`send-receive: fetching approval data ${fromBlock}..${toBlock} (elapsed: ${Date.now()-t0}ms)...`)
				const [
					spenderEvents,
					ownerEvents,
				] = await Promise.all([
					contract.web3contract.getPastEvents(
						"Approval", {fromBlock, toBlock, filter: {owner: selectedAddress}}),
					contract.web3contract.getPastEvents(
						"Approval", {fromBlock, toBlock, filter: {spender: selectedAddress}}),
				])
				spenderEvents.forEach((e) => spenders.add(e.returnValues.spender))
				ownerEvents.forEach((e) => owners.add(e.returnValues.owner))
				if (c.isCancelled()) {
					log.info(`send-receive: cancelled fetching approval data`)
					break
				}
				if (Date.now() - t0 > 60 * 1000) {
					log.warn(`send-receive: timed out trying to get all spender/owner data...`)
					incompleteBlockN = fromBlock
					break
				}
				prevDeltaMs = Date.now() - startMs
				toBlock -= batchSize
				batchSize = prevDeltaMs < 5 * 1000 ? Math.min(batchSize * 2, maxBatchSize) : batchSize
			}
			return {
				spenders: Array.from(spenders).sort(),
				owners: Array.from(owners).sort(),
				incompleteBlockN,
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
		maxHistoryDays: 1,
		maxEvents: 100,
	})

	const refetchAll = () => {
		refetch()
		approvalData.refetch()
		transferHistory.refetch()
	}

	const runTXs = (f: TXFunc) => {
		props.runTXs(f, (e?: Error) => {
			refetchAll()
			if (!e) { setResetAmounts((n) => n + 1) }
		})
	}
	const handleSend = (toAddress: string, amount: BigNumber) => {
		runTXs(
			async (kit: ContractKit) => {
				const contract = await newErc20(kit, erc20)
				const tx = contract.transfer(toAddress, amount)
				return [{tx: tx}]
			}
		)
	}
	const handleSendFrom = (fromAddress: string, toAddress: string, amount: BigNumber) => {
		runTXs(
			async (kit: ContractKit) => {
				const contract = await newErc20(kit, erc20)
				const tx = contract.transferFrom(fromAddress, toAddress, amount)
				return [{tx: tx}]
			}
		)
	}
	const handleApprove = (spender: string, amount: BigNumber) => {
		runTXs(
			async (kit: ContractKit) => {
				const contract = await newErc20(kit, erc20)
				const tx = contract.approve(spender, amount)
				return [{tx: tx}]
			}
		)
	}

	// TODO(zviadm): erc20 should be compared against current `feeCurrency` instead.
	const estimatedGas = erc20.symbol === "CELO" ? new BigNumber(0.0001).shiftedBy(erc20.decimals) : 0
	const maxToSend = fetched && BigNumber.maximum(fetched.balance.minus(estimatedGas), 0)
	return (
		<AppContainer>
			<AppHeader
				app={SendReceive}
				isFetching={isFetching || transferHistory.isFetching || approvalData.isFetching}
				refetch={refetchAll} />
			<AppSection>
				<SelectErc20
					erc20s={erc20List.erc20s}
					selected={erc20}
					onSelect={(e) => { setErc20Symbol(e.symbol) }}
					onRemoveToken={() => { erc20List.reload() }}
					onAddToken={(e) => {
						erc20List.reload()
						setErc20Symbol(e.symbol)
					}}
				/>
				<Box marginTop={1}>
					<Typography>
						Balance: {!fetched ? "?" : fmtAmount(fetched.balance, erc20.decimals)} {erc20.symbol}
						{fetched?.asCoreErc20 &&
						<Typography color="textSecondary" component="span">
							&nbsp;(~{fmtAmount(fetched.asCoreErc20.amount, coreErc20Decimals)} {fetched.asCoreErc20.coreErc20})
						</Typography>}
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
					<HiddenProgress hidden={!isFetching && !approvalData.isFetching} />
					<TabPanel value="transfer">
						<TransferTab
							erc20={erc20}
							maxToSend={maxToSend}
							addressBook={props.accounts}
							resetAmounts={resetAmounts}
							onSend={handleSend}
						/>
					</TabPanel>
					<TabPanel value="transfer-from">
						{approvalData.fetched &&
						<TransferFromTab
							erc20={erc20}
							account={props.selectedAccount}
							accountData={approvalData.fetched}
							addressBook={props.accounts}
							resetAmounts={resetAmounts}
							onSend={handleSendFrom}
						/>}
					</TabPanel>
					<TabPanel value="approvals">
						{approvalData.fetched &&
						<ApprovalsTab
							erc20={erc20}
							account={props.selectedAccount}
							accountData={approvalData.fetched}
							addressBook={props.accounts}
							onApprove={handleApprove}
						/>}
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
