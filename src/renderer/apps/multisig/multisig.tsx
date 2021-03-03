import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'

import { Account } from '../../../lib/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { MultiSig } from './def'
import useOnChainState from '../../state/onchain-state'

import * as React from 'react'
import {
	Box, TableBody, Table, TableRow, TableCell, Tab, TableHead, Button,
} from '@material-ui/core'
import { Alert, TabContext, TabList, TabPanel } from '@material-ui/lab'

import AppContainer from '../../components/app-container'
import AppHeader from '../../components/app-header'
import AppSection from '../../components/app-section'
import SectionTitle from '../../components/section-title'
import { contractName } from '../../../lib/registry'
import { OwnersTable, SignaturesTable } from './owners'
import { toTransactionObject } from '@celo/connect'

const MultiSigApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const account = props.selectedAccount
	const {
		fetched,
		isFetching,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			if (account.type !== "multisig") {
				return {}
			}
			const multiSig = await kit.contracts.getMultiSig(account.address)
			const transactionsP = multiSig.getTransactions()
			const owners = multiSig.getOwners()
			const requiredSigs = multiSig.getRequired()
			const requiredInternalSigs = multiSig.getInternalRequired()

			const transactions = (await transactionsP).map((t, idx) => ({...t, idx: idx}))
			const pendingTXs = transactions.filter((t) => !t.executed)
			const destinations = Array.from(new Set(transactions.map((t) => t.destination)))
			const contractNames = await Promise.all(destinations.map((d) => contractName(kit, d)))
			const contractNameMap = new Map(
				destinations.map((d, idx) => [d, contractNames[idx]])
			)
			return {
				transactions,
				pendingTXs,
				contractNameMap,
				owners: await owners,
				requiredSigs: await requiredSigs,
				requiredInternalSigs: await requiredInternalSigs,
			}
		},
		[account]
	))
	const [tab, setTab] = React.useState("transactions")

	const requiredConfirms = (
		destination: string,
		requiredSigs: BigNumber,
		requiredInternalSigs: BigNumber) => {
		return (destination === account.address) ? requiredInternalSigs : requiredSigs
	}
	const handleAddOwner = (newOwner: string) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.addOwner(newOwner))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}
	const handleRemoveOwner = (owner: string) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.removeOwner(owner))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}
	const handleReplaceOwner = (owner: string, newOwner: string) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.replaceOwner(owner, newOwner))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}
	const handleChangeRequiredSignatures = (signatures: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.changeRequirement(signatures))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}
	const handleChangeInternalRequiredSignatures = (signatures: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.changeInternalRequirement(signatures))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}

	return (
		<AppContainer>
			<AppHeader app={MultiSig} isFetching={isFetching} refetch={refetch} />
			{account.type !== "multisig" ?
			<AppSection>
				<Alert severity="info">
					Select MultiSig type account using the account selector. You can create
					or import MultiSig accounts in the Accounts app.
				</Alert>
			</AppSection> : fetched && <>
			<TabContext value={tab}>
				<AppSection innerPadding={0}>
					<TabList onChange={(e, v) => { setTab(v) }}>
						<Tab label="Transactions" value={"transactions"} />
						<Tab label="Owners" value={"owners"} />
					</TabList>
					<TabPanel value="transactions">
						{!fetched?.pendingTXs?.length ?
						<Alert severity="info">
							There are no pending transactions.
						</Alert> :
						<Box>
							<Table size="small">
								<TableHead>
									<TableCell>ID</TableCell>
									<TableCell width="100%">Contract & Data</TableCell>
									<TableCell align="right">Confirms</TableCell>
									<TableCell></TableCell>
								</TableHead>
								<TableBody>
									{
										fetched.pendingTXs.map((t) => {
											const required = requiredConfirms(t.destination, fetched.requiredSigs, fetched.requiredInternalSigs)
											const canExecute = required.lte(t.confirmations.length)
											const confirmedBySelf = t.confirmations.indexOf(account.ownerAddress) >= 0
											return (
												<TableRow key={t.idx}>
													<TableCell>{t.idx.toString()}</TableCell>
													<TableCell>{fetched.contractNameMap.get(t.destination)}</TableCell>
													<TableCell align="right">
														{t.confirmations.length} / {required.toString()}
													</TableCell>
													<TableCell>
														{canExecute ?
														<Button
															variant="outlined"
															color="primary"
														>Execute</Button> : (
															!confirmedBySelf ?
															<Button
																variant="outlined"
																color="primary"
															>Confirm</Button> :
															<Button
																variant="outlined"
																color="secondary"
															>Revoke</Button>
														)}
													</TableCell>
												</TableRow>
											)
										})
									}
								</TableBody>
							</Table>
						</Box>}
					</TabPanel>
					<TabPanel value="owners">
						<OwnersTable
							owners={fetched.owners || []}
							onAdd={handleAddOwner}
							onRemove={handleRemoveOwner}
							onReplace={handleReplaceOwner}
						/>
					</TabPanel>
				</AppSection>
				{tab === "owners" && <>
				<AppSection>
					<SectionTitle>Required signatures</SectionTitle>
					<SignaturesTable
						requiredSignatures={fetched?.requiredSigs?.toNumber() || 0}
						internalRequiredSignatures={fetched?.requiredInternalSigs?.toNumber() || 0}
						onChangeRequiredSignatures={handleChangeRequiredSignatures}
						onChangeInternalRequiredSignatures={handleChangeInternalRequiredSignatures}
					/>
				</AppSection>
				</>}
			</TabContext>
			</>}
		</AppContainer>
	)
}
export default MultiSigApp
