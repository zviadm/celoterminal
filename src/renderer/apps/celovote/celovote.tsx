import { shell } from 'electron'
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { ContractKit } from '@celo/contractkit'
import log from 'electron-log'
import { GroupVote } from '@celo/contractkit/lib/wrappers/Election'

import { Account } from '../../../lib/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { Celovote } from './def'
import useOnChainState from '../../state/onchain-state'
import { CFG, mainnetNetworkId } from '../../../lib/cfg'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import BigNumber from 'bignumber.js'
import Alert from '@material-ui/lab/Alert'
import TableContainer from '@material-ui/core/TableContainer'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import Link from '@material-ui/core/Link'

import AppHeader from '../../components/app-header'
import { UserError } from '../../../lib/error'

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
		log.info(`celovote[GQL]:`, resp.data)
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

	const minLocked = new BigNumber(100e18)
	const canAuthorize = fetched?.totalLocked.gte(minLocked)
	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader title={Celovote.title} url={Celovote.url} isFetching={isFetching} refetch={refetch} />
			{fetched && (
			fetched.isAuthorized ? <>
			<Box marginTop={2}>
				<Paper>
					<Box p={2}>
						<Alert severity="success">
						Account authorized with Celovote. Votes will be automatically cast
						and activated for all your locked CELO to earn rewards.
						</Alert>
					</Box>
				</Paper>
			</Box>
			<SummaryTable {...fetched} />
			</> : <>
			<Box marginTop={2}>
				<Paper>
					<Box display="flex" flexDirection="column" p={2}>
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
					</Box>
				</Paper>
			</Box>
			<SummaryTable {...fetched} />
			</>
			)}
		</Box>
	)
}
export default CelovoteApp

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
	return (
		<Box display="flex" flexDirection="column">
			<Box marginTop={2}>
				<TableContainer component={Paper}>
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
				</TableContainer>
			</Box>
			{votesDESC.length > 0 &&
			<Box marginTop={2}>
				<TableContainer component={Paper}>
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
				</TableContainer>
			</Box>}
		</Box>
	)
}

const GroupAddress = (props: {address: string}) => {
	const url = `https://thecelo.com/group/${props.address}`
	const handleClick = () => { shell.openExternal(url) }
	return (
		<Link
			component="button"
			variant="body2"
			underline="hover"
			onClick={handleClick}
			style={{fontFamily: "monospace"}}
			>
			{props.address}
		</Link>
	)
}