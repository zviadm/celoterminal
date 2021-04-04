import { ContractKit } from '@celo/contractkit'
import { isValidAddress } from 'ethereumjs-util'

import { Contracto } from './def'
import { Account } from '../../../lib/accounts/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'

import * as React from 'react'
import {
	Button, Box, Table, TableBody,
	TableCell, TableRow, Tab, TextField, LinearProgress, Accordion, AccordionSummary, AccordionDetails, Typography
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'

import AppHeader from '../../components/app-header'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import { ContractABI, fetchContractAbi } from '../../../lib/tx-parser/contract-abi'
import { AbiItem } from '@celo/connect'

const ContractoApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [contractAddress, setContractAddress] = useLocalStorageState("terminal/contracto/contract-address", "")
	const [editAddress, setEditAddress] = React.useState(contractAddress)
	React.useEffect(() => {
		if (editAddress === contractAddress) {
			return
		}
		if (isValidAddress(editAddress)) {
			setContractAddress(editAddress)
		} else {
			setContractAddress("")
		}
	}, [editAddress, contractAddress, setContractAddress])

	const account = props.selectedAccount
	const {
		fetched,
		isFetching,
		refetch,
		fetchError,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			if (contractAddress === "") {
				return {}
			}
			const contractAbi = await fetchContractAbi(kit, contractAddress)
			return {
				contractAddress: contractAddress,
				contractAbi,
			}
		},
		[contractAddress],
	), {noErrorPropagation: true})
	return (
		<AppContainer>
			<AppHeader app={Contracto} isFetching={isFetching} refetch={refetch} />
			<AppSection>
				<TextField
					id="contract-address"
					autoFocus
					label="Contract address"
					InputLabelProps={{shrink: true}}
					placeholder="0x..."
					size="medium"
					fullWidth={true}
					spellCheck={false}
					inputProps={{
						spellCheck: false,
						style: {fontFamily: "monospace"}
					}}
					value={editAddress}
					onChange={(event) => { setEditAddress(event.target.value) }}
				/>
				<Box display="flex" flexDirection="column" marginTop={1}>
					{isFetching && <LinearProgress />}
					{fetchError &&
					<Alert severity="error">{`${fetchError}`}</Alert>}
				</Box>
			</AppSection>
			{fetched?.contractAbi &&
			<ContractView
				contractAddress={fetched.contractAddress}
				contractAbi={fetched.contractAbi}
			/>}
		</AppContainer>
	)
}
export default ContractoApp

const ContractView = (props: {
	contractAddress: string,
	contractAbi: ContractABI,
}) => {
	const [tab, setTab] = React.useState("read")
	const readFuncs = props.contractAbi.abi.filter(
		(abi) => abi.type === "function" &&
		(abi.stateMutability === "pure" || abi.stateMutability === "view"))
	const writeFuncs = props.contractAbi.abi.filter(
		(abi) => abi.type === "function" &&
		!(abi.stateMutability === "pure" || abi.stateMutability === "view"))
	return (<>
		<AppSection>
			Contract: {props.contractAbi.contractName}
		</AppSection>
		<AppSection innerPadding={0}>
			<TabContext value={tab}>
				<TabList onChange={(e, v) => { setTab(v) }}>
					<Tab label="Read" value={"read"} />
					<Tab label="Write" value={"write"} />
				</TabList>
				<TabPanel value="read">
					{
						readFuncs.map((abi) => (
							<ReadContract key={abi.name} contractAddress={props.contractAddress} abi={abi} />
						))
					}
				</TabPanel>
				<TabPanel value="write">
					{
						writeFuncs.map((abi) => {
							return (
								<p key={abi.name}>{abi.name}</p>
							)
						})
					}
				</TabPanel>
			</TabContext>
		</AppSection>
	</>)
}

const ReadContract = (props: {
	contractAddress: string,
	abi: AbiItem,
}) => {
	const [expanded, setExpanded] = React.useState(false)
	const [scheduleQuery, setScheduleQuery] = React.useState(false)
	const contractAddress = props.contractAddress
	const abi = props.abi
	const {
		fetched,
		fetchError,
		isFetching,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const contract = new kit.web3.eth.Contract([abi], contractAddress)
			const result = await contract.methods[abi.name || ""]().call()
			return {result}
		},
		[contractAddress, abi],
	), {noErrorPropagation: true, lazyFetch: true})
	React.useEffect(() => {
		if (!isFetching && scheduleQuery) {
			refetch()
			setScheduleQuery(false)
		}
	}, [refetch, scheduleQuery, isFetching])

	const canQuery = !scheduleQuery && !isFetching
	return (
		<Accordion
			expanded={expanded}
			onChange={(event, expanded) => {
				setExpanded(expanded)
				if (expanded && props.abi.inputs?.length === 0) {
					setScheduleQuery(true)
				}
			}}
		>
			<AccordionSummary>{props.abi.name}</AccordionSummary>
			<AccordionDetails>
				<Box flex={1} display="flex" flexDirection="column">
					{props.abi.inputs?.length !== 0 && <>
					<Button
						variant="outlined"
						onClick={() => { setScheduleQuery(true) }}
						disabled={!canQuery}
						>Query</Button>
					</>}
					{isFetching && <LinearProgress />}
					{fetched && <>
					<Typography>{`${fetched.result}`}</Typography>
					</>}
					{fetchError &&
					<Alert severity="error">{`${fetchError}`}</Alert>}
				</Box>
			</AccordionDetails>
		</Accordion>

	)
}