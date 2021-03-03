import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'

import { Account } from '../../../lib/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { MultiSig } from './def'
import { explorerRootURL } from '../../../lib/cfg'
import { fmtAddress } from '../../../lib/utils'
import useLocalStorageState from '../../state/localstorage-state'
import useOnChainState from '../../state/onchain-state'

import * as React from 'react'
import {
	Box, TableBody, Table, TableRow, TableCell, Tab, TableHead, Button,
	Typography
} from '@material-ui/core'
import { Alert, TabContext, TabList, TabPanel } from '@material-ui/lab'
import { Add } from '@material-ui/icons'

import AppContainer from '../../components/app-container'
import AppHeader from '../../components/app-header'
import AppSection from '../../components/app-section'
import Link from '../../components/link'
import SectionTitle from '../../components/section-title'
import { contractName } from '../../../lib/registry'

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
			const multisig = await kit.contracts.getMultiSig(account.address)
			const transactionsP = multisig.getTransactions()
			const owners = multisig.getOwners()
			const requiredSigs = multisig.getRequired()
			const requiredInternalSigs = multisig.getInternalRequired()

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
	const [tab, setTab] = useLocalStorageState("terminal/multisig/tab", "transactions")

	const requiredConfirms = (
		destination: string,
		requiredSigs: BigNumber,
		requiredInternalSigs: BigNumber) => {
		return (destination === account.address) ? requiredInternalSigs : requiredSigs
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
						<Table size="small">
							<TableBody>
								{fetched.owners?.map((o) => {
									return (
										<TableRow key={o}>
											<TableCell width="100%"><LinkedAddress address={o} /></TableCell>
											<TableCell>
												<Button
													variant="outlined"
													color="secondary">Replace</Button>
											</TableCell>
											<TableCell>
												<Button
													variant="outlined"
													color="secondary">Remove</Button>
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
						<Box display="flex" flexDirection="column" marginTop={1}>
							<Button
								variant="outlined"
								color="primary"
								startIcon={<Add />}>
								Add Owner
							</Button>
						</Box>
					</TabPanel>
				</AppSection>
				{tab === "owners" && <>
				<AppSection>
					<SectionTitle>Required signatures</SectionTitle>
					<Table size="small">
						<TableBody>
							<TableRow>
								<TableCell width="100%">For executing transactions</TableCell>
								<TableCell>{fetched.requiredSigs?.toString()}</TableCell>
								<TableCell>
									<Button variant="outlined" color="secondary">Change</Button>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell width="100%">For changing MultiSig properties</TableCell>
								<TableCell>{fetched.requiredInternalSigs?.toString()}</TableCell>
								<TableCell>
									<Button variant="outlined" color="secondary">Change</Button>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</AppSection>
				</>}
			</TabContext>
			</>}
		</AppContainer>
	)
}
export default MultiSigApp

const LinkedAddress = (props: {address: string}) => {
	const url = `${explorerRootURL()}/address/${props.address}`
	return (
		<Link href={url}>
			<Typography style={{fontFamily: "monospace"}}>{fmtAddress(props.address)}</Typography>
		</Link>
	)
}