import { ContractKit } from '@celo/contractkit'
import { AbiItem, toTransactionObject } from '@celo/connect'
import { isValidAddress } from 'ethereumjs-util'
import BigNumber from 'bignumber.js'

import { Contracto } from './def'
import { Account } from '../../../lib/accounts/accounts'
import { ContractABI, fetchContractAbi } from '../../../lib/tx-parser/contract-abi'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'

import * as React from 'react'
import {
	Box, Tab, TextField, LinearProgress,
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'

import AppHeader from '../../components/app-header'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import LinkedAddress from '../../components/linked-address'
import ReadContract from './read-contract'
import WriteContract from './write-contract'

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
		} else if (contractAddress !== "") {
			setContractAddress("")
		}
	}, [editAddress, contractAddress, setContractAddress])

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

	const handleExecute = (
		contractAddress: string, abi: AbiItem, inputs: string[], value?: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const contract = new kit.web3.eth.Contract([abi], contractAddress)
				const txo = contract.methods[abi.name || ""](...inputs)
				const tx = toTransactionObject(kit.connection, txo)
				return [{tx: tx, params: {value: value?.toFixed(0)}}]
			}
		)
	}

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
				onExecute={handleExecute}
			/>}
		</AppContainer>
	)
}
export default ContractoApp

const ContractView = (props: {
	contractAddress: string,
	contractAbi: ContractABI,
	onExecute: (contractAddress: string, abi: AbiItem, inputs: string[]) => void
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
			<LinkedAddress
				name={`${props.contractAbi.verifiedName || `Unknown Contract `} ${props.contractAddress}`}
				address={props.contractAddress}
			/>
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
						writeFuncs.map((abi) => (
							<WriteContract
								key={abi.name}
								contractAddress={props.contractAddress}
								abi={abi}
								onExecute={props.onExecute}
							/>
						))
					}
				</TabPanel>
			</TabContext>
		</AppSection>
	</>)
}
