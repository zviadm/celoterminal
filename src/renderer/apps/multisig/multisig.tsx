import { Account } from '../../../lib/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { MultiSig } from './def'

import * as React from 'react'
import {
	Box, TableBody, Table, TableRow, TableCell, Tab, TableHead, Button,
	Typography
} from '@material-ui/core'
import { Alert, TabContext, TabList, TabPanel } from '@material-ui/lab'

import AppContainer from '../../components/app-container'
import AppHeader from '../../components/app-header'
import AppSection from '../../components/app-section'
import useOnChainState from '../../state/onchain-state'
import { ContractKit } from '@celo/contractkit'
import Link from '../../components/link'
import { explorerRootURL } from '../../../lib/cfg'
import { fmtAddress } from '../../../lib/utils'
import { Add } from '@material-ui/icons'
import useLocalStorageState from '../../state/localstorage-state'
import SectionTitle from '../../components/section-title'

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
			const transactions = multisig.getTransactions()
			const owners = multisig.getOwners()
			const requiredSigs = multisig.getRequired()
			const requiredInternalSigs = multisig.getInternalRequired()
			return {
				transactions: await transactions,
				owners: await owners,
				requiredSigs: await requiredSigs,
				requiredInternalSigs: await requiredInternalSigs,
			}
		},
		[account]
	))
	const [tab, setTab] = useLocalStorageState("terminal/multisig/tab", "transactions")

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
						{!fetched.transactions?.length ?
						<Alert severity="info">
							There are no pending transactions.
						</Alert> :
						<Box>
							Pending transactions: {fetched.transactions?.length}
						</Box>}
					</TabPanel>
					<TabPanel value="owners">
						<SectionTitle>Owners</SectionTitle>
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
						<Box display="flex" flexDirection="column" marginTop={6}>
							<SectionTitle>Required signatures</SectionTitle>
							<Table size="small">
								<TableBody>
									<TableRow>
										<TableCell width="100%">For executing transactions</TableCell>
										<TableCell>{fetched.requiredSigs?.toString()}</TableCell>
										<TableCell>
											<Button variant="outlined" color="primary">Change</Button>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell width="100%">For changing MultiSig properties</TableCell>
										<TableCell>{fetched.requiredInternalSigs?.toString()}</TableCell>
										<TableCell>
											<Button variant="outlined" color="primary">Change</Button>
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Box>
					</TabPanel>
				</AppSection>
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