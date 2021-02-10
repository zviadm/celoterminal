import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'

import { Account } from '../../../lib/accounts'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'
import { Governance } from './def'
import useOnChainState from '../../state/onchain-state'

import * as React from 'react'
import {
	Box, Button, Paper, Table, TableBody,
	TableCell, TableHead, TableRow, Typography
} from '@material-ui/core'

import AppHeader from '../../components/app-header'
import { Alert } from '@material-ui/lab'

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
			const upvotes = governance.getQueue()
			const dequeue = governance.getDequeue(true)
			const upvoteRecord = governance.getUpvoteRecord(account.address)
			const voteRecords = governance.getVoteRecords(account.address)
			return {
				// upvotes: await upvotes,
				upvotes: [
					{proposalID: new BigNumber(1), upvotes: new BigNumber(1)},
					{proposalID: new BigNumber(2), upvotes: new BigNumber(10)},
					{proposalID: new BigNumber(3), upvotes: new BigNumber(100)},
				],
				dequeue: await dequeue,
				// upvoteRecord: await upvoteRecord,
				upvoteRecord: {
					proposalID: new BigNumber(2),
					upvotes: new BigNumber(5),
				},
				voteRecords: await voteRecords,
			}
		},
		[account],
	))


	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader app={Governance} isFetching={isFetching} refetch={refetch} />
			{fetched && <>
			<Box marginTop={2}>
				<Paper>
					<Box p={2} display="flex" flexDirection="column">
						<Alert severity="info">
							Only one proposal can be upvoted at a time.
						</Alert>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Proposal ID</TableCell>
									<TableCell>Upvotes</TableCell>
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
											{v.proposalID.toString()}
										</TableCell>
										<TableCell>
											{v.upvotes.toString()}
										</TableCell>
										<TableCell>
											<Box display="flex" flexDirection="column">
											<Button
												variant={isUpvoted ? "contained" : "outlined"}
												color={isUpvoted ? "primary" : "default"}
												>{isUpvoted ? "Upvoted" : "Upvote"}</Button>
											</Box>
										</TableCell>
									</TableRow>)
								})
							}
							</TableBody>
						</Table>
					</Box>
				</Paper>
			</Box>
			</>}
		</Box>
	)
}
export default GovernanceApp