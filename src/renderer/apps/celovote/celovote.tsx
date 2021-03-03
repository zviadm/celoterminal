import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import log from 'electron-log'
import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import { GroupVote } from '@celo/contractkit/lib/wrappers/Election'

import { Account } from '../../../lib/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { Celovote } from './def'
import useOnChainState from '../../state/onchain-state'
import { CFG, mainnetNetworkId } from '../../../lib/cfg'
import { fmtAddress, fmtAmount } from '../../../lib/utils'
import { UserError } from '../../../lib/error'

import * as React from 'react'
import {
	Dialog, DialogActions, DialogContent, Box, Button,
	TableBody, Table, TableRow, TableCell, TableHead, DialogTitle,
} from '@material-ui/core'
import { Alert } from '@material-ui/lab'

import AppHeader from '../../components/app-header'
import Link from '../../components/link'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'

let _client: AxiosInstance
const gql = () => {
	if (!_client) {
		_client = axios.create({baseURL: "https://gql.celovote.com"})
	}
	return _client
}

async function promiseGQL<T extends {errors?: {message: string}[]}>(p: Promise<AxiosResponse<T>>) {
	try {
		const resp = await p
		if (resp.data.errors && resp.data.errors.length > 0) {
			throw new Error(resp.data.errors[0].message)
		}
		log.debug(`celovote[GQL]:`, resp.data)
		return resp
	} catch (e) {
		if (e?.response) {
			throw new Error(`${e.message}: ${JSON.stringify((e as AxiosError).response)}`)
		}
		throw e
	}
}

const CelovoteApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const account = props.selectedAccount
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			if (CFG().networkId !== mainnetNetworkId) {
				throw new UserError(`Celovote APP only works with Mainnet.`)
			}
			const accounts = await kit.contracts.getAccounts()
			const isAccount = await accounts.isAccount(account.address)
			if (!isAccount) {
				return {
					isAuthorized: false,
					totalLocked: new BigNumber(0),
					nonvoting: new BigNumber(0),
					votes: [],
				}
			}
			const lockedGold = await kit.contracts.getLockedGold()
			const election = await kit.contracts.getElection()
			const totalLocked = lockedGold.getAccountTotalLockedGold(account.address)
			const nonvoting = lockedGold.getAccountNonvotingLockedGold(account.address)
			const votesP = election.getVoter(account.address)

			const respP = gql().post<{
				errors?: {message: string}[],
				data: {
					addresses: {
						authorized: boolean,
					}[],
				}
			}>(
				'/', {
				query: `{ addresses(addresses:["${account.address}"]) { authorized } }`
			})
			const resp = await promiseGQL(respP)
			const votes = await votesP
			return {
				isAuthorized: resp.data.data.addresses[0].authorized,
				totalLocked: await totalLocked,
				nonvoting: await nonvoting,
				votes: votes.votes,
			}
		},
		[account]
	))
	const [confirmRemoveAuth, setConfirmRemoveAuth] = React.useState(false)

	const handleAuthorize = () => {
		props.runTXs(async (kit: ContractKit) => {
			const resp = await promiseGQL(gql().post<{
				errors?: {message: string}[],
				data: {
					signPOP: {
						signer: string,
						signature: {v: number, r: string, s: string},
					},
				},
			}>(
				'/', {
				query: `mutation {
					signPOP(address:"${account.address}") {
						signer
						signature { v r s }
					}
				}`
			}))
			const accounts = await kit.contracts.getAccounts()
			const tx = await accounts.authorizeVoteSigner(
				resp.data.data.signPOP.signer,
				resp.data.data.signPOP.signature)
			return [{tx: tx}]
		},
		(e?: Error) => {
			refetch()
			if (!e) {
				promiseGQL(gql().post('/', {
					query: `mutation { autoVote(addresses:["${account.address}"]) }`,
				}))
				.then(() => { refetch() })
			}
		})
	}
	const handleRemoveAuthorization = () => {
		setConfirmRemoveAuth(false)
		props.runTXs(async (kit: ContractKit) => {
			const accounts = await kit.contracts.getAccounts()
			// create a new random signer to authorize as vote signer. This is the only way to
			// clear a vote signer right now.
			const signer = kit.web3.eth.accounts.create()
			const pop = await accounts.generateProofOfKeyPossessionLocally(
				account.address, signer.address, signer.privateKey)
			const tx = await accounts.authorizeVoteSigner(signer.address, pop)
			return [{tx: tx}]
		},
		() => { refetch() })
	}

	const minLocked = new BigNumber(100e18)
	const canAuthorize = fetched?.totalLocked.gte(minLocked)
	return (
		<AppContainer>
			<AppHeader app={Celovote} isFetching={isFetching} refetch={refetch} />
			{confirmRemoveAuth &&
			<ConfirmRemoveAuthorization
				onCancel={() => { setConfirmRemoveAuth(false)}}
				onConfirm={handleRemoveAuthorization}
			/>}
			{fetched && (
			fetched.isAuthorized ? <>
			<AppSection>
				<Alert severity="success">
				Account authorized with Celovote. Votes will be automatically cast
				and activated for all your locked CELO to earn rewards.
				<br />
				<br />
				View rewards for <Link
					href={`https://celovote.com/rewards?addresses=${account.address}`}>
					this account</Link>.
				<br />
				View rewards for <Link
					href={`https://celovote.com/rewards?addresses=${props.accounts.map((a) => a.address).join(",")}`}>
					all accounts</Link>.
				</Alert>
			</AppSection>
			<SummaryTable {...fetched} />
			<AppSection>
				<Button
					color="secondary"
					variant="outlined"
					onClick={() => { setConfirmRemoveAuth(true) }}
					>Remove Authorization</Button>
			</AppSection>
			</> : <>
			<AppSection>
				<Box marginBottom={1}>
					<Alert severity="info">{Celovote.description}</Alert>
				</Box>
				{!canAuthorize &&
				<Box marginBottom={1}>
					<Alert severity="warning">
					Minimum {fmtAmount(minLocked, "CELO", 0)} CELO must be locked to use Celovote service.
					</Alert>
				</Box>
				}
				<Button
					color="primary"
					variant="outlined"
					onClick={handleAuthorize}
					disabled={!canAuthorize}
					>Authorize</Button>
			</AppSection>
			<SummaryTable {...fetched} />
			</>
			)}
		</AppContainer>
	)
}
export default CelovoteApp

const ConfirmRemoveAuthorization = (props: {
	onCancel: () => void,
	onConfirm: () => void,
}) => {
	return (
		<Dialog open={true} maxWidth="xs" onClose={props.onCancel}>
			<DialogTitle>Remove authorization</DialogTitle>
			<DialogContent>
				<Alert severity="error">
					Celovote will no longer be able to cast and activate votes on your behalf.
					Removing authorization will not change the votes that are already cast.
				</Alert>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button color="secondary" onClick={props.onConfirm}>Confirm</Button>
			</DialogActions>
		</Dialog>
	)
}

const SummaryTable = (props: {
	totalLocked: BigNumber,
	nonvoting: BigNumber,
	votes: GroupVote[],
}) => {
	const votesActive = BigNumber.sum(0, ...props.votes.map((v) => v.active))
	const votesPending = BigNumber.sum(0, ...props.votes.map((v) => v.pending))
	const votesDESC = [...props.votes].sort(
		(a, b) =>
			a.active.plus(a.pending)
			.minus(b.active.plus(b.pending))
			.negated().toNumber())
	return (<>
		<AppSection>
			<Table size="small">
				<TableBody>
					<TableRow>
						<TableCell style={{whiteSpace: "nowrap"}}>Locked CELO</TableCell>
						<TableCell width="100%">{fmtAmount(props.totalLocked, "CELO")}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell style={{whiteSpace: "nowrap"}}>Votes (active)</TableCell>
						<TableCell>{fmtAmount(votesActive, "CELO")}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell style={{whiteSpace: "nowrap"}}>Votes (pending)</TableCell>
						<TableCell>{fmtAmount(votesPending, "CELO")}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell style={{whiteSpace: "nowrap"}}>Nonvoting</TableCell>
						<TableCell>{fmtAmount(props.nonvoting, "CELO")}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</AppSection>
		{votesDESC.length > 0 &&
		<AppSection>
			<Table size="small">
				<TableHead>
					<TableRow>
						<TableCell width="100%">Group</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}} align="right">Votes (active)</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}} align="right">Votes (pending)</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{
					votesDESC.map((v) => (
						<TableRow key={v.group}>
							<TableCell><GroupAddress address={v.group} /></TableCell>
							<TableCell align="right">{fmtAmount(v.active, "CELO")}</TableCell>
							<TableCell align="right">{fmtAmount(v.pending, "CELO")}</TableCell>
						</TableRow>
					))
					}
				</TableBody>
			</Table>
		</AppSection>}
	</>)
}

const GroupAddress = (props: {address: string}) => {
	const url = `https://thecelo.com/group/${props.address}`
	return (
		<Link
			href={url}
			style={{fontFamily: "monospace"}}>{fmtAddress(props.address)}</Link>
	)
}