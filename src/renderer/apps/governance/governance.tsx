import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import { concurrentMap } from '@celo/utils/lib/async'
import { secondsToDurationString } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { ProposalStage, VoteValue } from '@celo/contractkit/lib/wrappers/Governance'

import { Account } from '../../../lib/accounts/accounts'
import { Transaction, TXFinishFunc, TXFunc } from '../../components/app-definition'
import { Governance } from './def'
import useOnChainState from '../../state/onchain-state'
import { fmtAmount } from '../../../lib/utils'
import { nowMS } from '../../state/time'

import * as React from 'react'
import {
	Box, Button, Table, TableBody,
	TableCell, TableHead, TableRow
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import AlertTitle from '@material-ui/lab/AlertTitle'

import AppHeader from '../../components/app-header'
import Link from '../../components/link'
import AppSection from '../../components/app-section'
import AppContainer from '../../components/app-container'

const GovernanceApp = (props: {
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
			const governance = await kit.contracts.getGovernance()
			const accounts = await kit.contracts.getAccounts()
			const lockedGold = await kit.contracts.getLockedGold()

			const upvotes = governance.getQueue()
			const dequeue = governance.getDequeue(true)
			const durations = governance.stageDurations()
			const now = Math.round(nowMS() / 1000)
			const proposals = Promise.all([dequeue, durations]).then(([dequeue, durations]) => {
				return concurrentMap(4, dequeue, async (p) => {
					const [record, isExpired] = await Promise.all([
						governance.getProposalRecord(p),
						governance.isDequeuedProposalExpired(p),
					])
					const timeUntilExecution =
						secondsToDurationString(
							record.metadata.timestamp
							.plus(durations.Referendum)
							.minus(now),
							["day", "hour", "minute"],
						)
					return {
						proposalID: p,
						stage: isExpired ? ProposalStage.Expiration : record.stage,
						votes: record.votes,
						passing: record.passed, // TODO(zviad): check if this is same as before.
						timestamp: record.metadata.timestamp,
						timeUntilExecution,
					}
				})
			})

			const isSigner = await accounts.isSigner(account.address)
			const mainAccount = !isSigner ? account.address :
				(await accounts.voteSignerToAccount(account.address))

			const upvoteRecord = governance.getUpvoteRecord(mainAccount)
			const voteRecords = governance.getVoteRecords(mainAccount)

			const proposalsInReferendum = (await proposals)
				.filter((p) => p.stage === ProposalStage.Referendum)
				.sort((a, b) => (a.timestamp.lt(b.timestamp) ? -1 : 1))
			const isAccount = await accounts.isAccount(mainAccount)
			const lockedCELO = !isAccount ? new BigNumber(0) :
				await lockedGold.getAccountTotalLockedGold(mainAccount)
			return {
				mainAccount,
				isAccount,
				lockedCELO,

				upvotes: await upvotes,
				upvoteRecord: await upvoteRecord,

				proposals: proposalsInReferendum,
				voteRecords: await voteRecords,
			}
		},
		[account],
	))

	const handleUpvote = (proposalID: BigNumber) => {
		props.runTXs(async (kit: ContractKit) => {
			if (!fetched) { return [] }
			const governance = await kit.contracts.getGovernance()
			const txs: Transaction[] = []
			if (fetched.upvotes.find((u) => u.proposalID.eq(fetched.upvoteRecord.proposalID))) {
				const txRevoke = await governance.revokeUpvote(fetched.mainAccount)
				txs.push({tx: txRevoke})
			}
			const tx = await governance.upvote(proposalID, fetched.mainAccount)
			txs.push({tx: tx})
			return txs
		},
		() => { refetch() })
	}
	const handleVote = (proposalID: BigNumber, vote: "Yes" | "No" | "Abstain") => {
		props.runTXs(async (kit: ContractKit) => {
			const governance = await kit.contracts.getGovernance()
			const tx = await governance.vote(proposalID, vote)
			return [{tx: tx}]
		},
		() => { refetch() })
	}

	const canVote = fetched?.isAccount && fetched?.lockedCELO.gt(0)
	return (
		<AppContainer>
			<AppHeader app={Governance} isFetching={isFetching} refetch={refetch} />
			{fetched && <>
			<AppSection>
				<Alert severity="info">
				Use <Link href="https://celo.stake.id">celo.stake.id</Link> to view more in-depth
				information about all past and currently active governance proposals.
				</Alert>
			</AppSection>
			{fetched.proposals.length === 0 && fetched.upvotes.length === 0 &&
			<AppSection>
				<Alert severity="info">
					There are no active governance proposals to upvote or vote right now.
				</Alert>
			</AppSection>}
			{fetched.proposals.length > 0 &&
			<AppSection>
				{canVote ?
				<Alert severity="info">
					Voting on a proposal disables unlocking of CELO until
					proposal is finished.
				</Alert> :
				<Alert severity="error">
					To participate in governance,
					you need to first register your address and lock CELO using the Locker app.
				</Alert>}
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>ID</TableCell>
							<TableCell width="100%">Votes</TableCell>
							<TableCell></TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
					{
						fetched.proposals.map((p) => {
							const vote = fetched.voteRecords.find((v) => v.proposalID.eq(p.proposalID))
							if (!p.votes) {
								return <></>
							}
							const total = p.votes.Yes.plus(p.votes.No).plus(p.votes.Abstain)
							return (
							<TableRow key={p.proposalID.toString()}>
								<TableCell>
									<ProposalID id={p.proposalID} />
								</TableCell>
								<TableCell padding="none" style={{paddingBottom: 10, paddingTop: 10}}>
									<Alert severity={p.passing ? "success" : "error"}>
										<AlertTitle>{p.passing ? "Passing" : "Not Passing"}</AlertTitle>
										{`Time left: ${p.timeUntilExecution}\u2026`}
									</Alert>
									<Table size="small">
										<TableBody>
											<TableRow>
												<TableCell>Yes</TableCell>
												<TableCell width="100%">{fmtAmount(p.votes.Yes, "CELO", 0)}</TableCell>
												<TableCell>{p.votes.Yes.div(total).multipliedBy(100).toFixed(0)}%</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>No</TableCell>
												<TableCell>{fmtAmount(p.votes.No, "CELO", 0)}</TableCell>
												<TableCell>{p.votes.No.div(total).multipliedBy(100).toFixed(0)}%</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>Abstain</TableCell>
												<TableCell>{fmtAmount(p.votes.Abstain, "CELO", 0)}</TableCell>
												<TableCell>{p.votes.Abstain.div(total).multipliedBy(100).toFixed(0)}%</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</TableCell>
								<TableCell>
									<Box display="flex" flexDirection="column">
									{
										([VoteValue.Yes, VoteValue.No, VoteValue.Abstain] as
										("Yes" | "No" | "Abstain")[]).map((v) => (
											<Box key={v} marginBottom={0.5}>
												<Button
													id={`vote-${v}-${p.proposalID.toString()}`}
													style={{width: 100}}
													variant={vote?.value === v ? "contained" : "outlined"}
													color={vote?.value === v ? "primary" : "default"}
													disabled={!canVote}
													onClick={() => { handleVote(p.proposalID, v) }}
													>{v}</Button>
											</Box>
										))
									}
									</Box>
								</TableCell>
							</TableRow>)
						})
					}
					</TableBody>
				</Table>
			</AppSection>}
			{fetched.upvotes.length > 0 &&
			<AppSection>
				{canVote ?
				<Alert severity="info">
					Only one proposal can be upvoted at a time.
				</Alert> :
				<Alert severity="error">
					To participate in governance,
					you need to first register your address and lock CELO using the Locker app.
				</Alert>}
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>ID</TableCell>
							<TableCell width="100%">Upvotes</TableCell>
							<TableCell></TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
					{
						fetched.upvotes.map((v) => {
							const isUpvoted = v.proposalID.eq(fetched.upvoteRecord.proposalID)
							return (
							<TableRow key={v.proposalID.toString()}>
								<TableCell>
									<ProposalID id={v.proposalID} />
								</TableCell>
								<TableCell>{fmtAmount(v.upvotes, "CELO", 0)}</TableCell>
								<TableCell>
									<Box display="flex" flexDirection="column">
									<Button
										id={`upvote-${v.proposalID.toString()}`}
										style={{width: 100}}
										variant={isUpvoted ? "contained" : "outlined"}
										color={isUpvoted ? "primary" : "default"}
										disabled={!canVote}
										onClick={() => { handleUpvote(v.proposalID) }}
										>{isUpvoted ? "Upvoted" : "Upvote"}</Button>
									</Box>
								</TableCell>
							</TableRow>)
						})
					}
					</TableBody>
				</Table>
			</AppSection>}
			</>}
		</AppContainer>
	)
}
export default GovernanceApp

const ProposalID = (props: {
	id: BigNumber
}) => {
	return (
		<Link href={`https://celo.stake.id/#/proposal/${props.id.toString()}`}>{props.id.toString()}</Link>
	)
}