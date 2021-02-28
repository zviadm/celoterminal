import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import { PendingWithdrawal } from '@celo/contractkit/lib/wrappers/LockedGold'
import { GroupVote } from '@celo/contractkit/lib/wrappers/Election'
import { toTransactionObject } from '@celo/connect'

import { Account } from '../../../lib/accounts'
import useOnChainState from '../../state/onchain-state'
import { fmtAmount } from '../../../lib/utils'
import { TXFunc, TXFinishFunc, Transaction } from '../../components/app-definition'
import { Locker } from './def'
import { nowMS } from '../../state/time'
import { coreErc20Decimals } from '../../../lib/erc20/core'

import * as React from 'react'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Alert from '@material-ui/lab/Alert'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import Tooltip from '@material-ui/core/Tooltip'

import AppHeader from '../../components/app-header'
import NumberInput from '../../components/number-input'

const LockerApp = (props: {
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
			const accounts = await kit.contracts.getAccounts()
			const isAccount = await accounts.isAccount(account.address)
			if (!isAccount) {
				return { isAccount }
			}
			const goldToken = await kit.contracts.getGoldToken()
			const lockedGold = await kit.contracts.getLockedGold()
			const election = await kit.contracts.getElection()
			const governance = await kit.contracts.getGovernance()
			const config = lockedGold.getConfig()
			const totalCELO = goldToken.balanceOf(account.address)
			const totalLocked = lockedGold.getAccountTotalLockedGold(account.address)
			const nonvotingLocked = lockedGold.getAccountNonvotingLockedGold(account.address)
			const pendingWithdrawals = lockedGold.getPendingWithdrawals(account.address)
			const votes = election.getVoter(account.address)
			const isVotingInGovernance = governance.isVoting(account.address)
			return {
				isAccount,
				unlockingPeriod: (await config).unlockingPeriod,
				totalCELO: await totalCELO,
				totalLocked: await totalLocked,
				nonvotingLocked: await nonvotingLocked,
				pendingWithdrawals: await pendingWithdrawals,
				votes: (await votes).votes,
				isVotingInGovernance: (await isVotingInGovernance),
			}
		},
		[account]
	))
	const [toLock, setToLock] = React.useState("")
	const [toUnlock, setToUnlock] = React.useState("")
	const toLockWEI = new BigNumber(toLock).shiftedBy(coreErc20Decimals)

	const runTXs = (f: TXFunc) => {
		props.runTXs(f, (e?: Error) => {
			refetch()
			if (!e) {
				setToLock("")
				setToUnlock("")
			}
		})
	}
	const handleCreateAccount = () => {
		runTXs(async (kit: ContractKit) => {
			const accounts = await kit.contracts.getAccounts()
			const tx = accounts.createAccount()
			return [{tx: tx}]
		})
	}
	const handleLock = () => {
		runTXs(async (kit: ContractKit): Promise<Transaction[]> => {
			const lockedGold = await kit.contracts.getLockedGold()
			const tx = lockedGold.lock()
			return [{tx: tx, params: {value: toLockWEI.toFixed(0)}}]
		})
	}
	const handleUnlock = (
		toUnlock: BigNumber,
		revoke?: {group: string, amount: BigNumber},
		) => {
		runTXs(async (kit: ContractKit) => {
			const lockedGold = await kit.contracts.getLockedGold()
			const election = await kit.contracts.getElection()
			const txs = []
			if (revoke) {
				const revokeTXs = await election.revoke(account.address, revoke.group, revoke.amount)
				txs.push(...revokeTXs)
			}
			txs.push(lockedGold.unlock(toUnlock))
			return txs.map((tx) => ({tx: tx}))
		})
	}
	const handleWithdraw = (idx: number) => {
		runTXs(async (kit: ContractKit) => {
			const lockedGold = await kit.contracts.getLockedGold()
			const tx = lockedGold.withdraw(idx)
			return [{tx: tx}]
		})
	}
	const handleCancelWithdraw = (idx: number, pending: PendingWithdrawal) => {
		runTXs(async (kit: ContractKit) => {
			const lockedGold = await kit._web3Contracts.getLockedGold()
			const txo = lockedGold.methods.relock(idx, pending.value.toFixed(0))
			const tx = toTransactionObject(kit.connection, txo)
			return [{tx: tx}]
		})
	}

	const canLock = (
		toLock !== "" && fetched && fetched.isAccount &&
		toLockWEI.gt(0) && fetched.totalCELO.gte(toLockWEI))
	// TODO(zviadm): only keep extra CELO if current feeCurrency is set as CELO.
	// Keep at least 0.0001 CELO unlocked to avoid running out of Gas completely.
	const maxToLock = fetched?.totalCELO && BigNumber.maximum(
		fetched.totalCELO.shiftedBy(-coreErc20Decimals).minus(0.0001), 0)
	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader app={Locker} isFetching={isFetching} refetch={refetch} />
			{fetched &&
			(!fetched.isAccount ?
			<Box marginTop={2}>
				<Paper>
					<Box display="flex" flexDirection="column" p={2}>
						<Alert severity="info">
							To lock CELO and participate in elections or governance,
							you need to register your address by creating an account first.
						</Alert>
						<Box display="flex" flexDirection="column" marginTop={1}>
							<Button
								id="create-account"
								color="primary"
								variant="outlined"
								onClick={handleCreateAccount}>Create Account</Button>
						</Box>
					</Box>
				</Paper>
			</Box>
			:
			<>
			<Box marginTop={2}>
				<Paper>
					<Box display="flex" flexDirection="column" p={2}>
						<Typography>Balance: {fmtAmount(fetched.totalCELO, "CELO")} CELO</Typography>
						<NumberInput
							autoFocus
							margin="dense"
							variant="outlined"
							id="lock-celo-input"
							label={`Lock (max: ${fmtAmount(fetched.totalCELO, "CELO")})`}
							value={toLock}
							onChangeValue={setToLock}
							maxValue={maxToLock}
						/>
						<Button
							id="lock-celo"
							variant="outlined"
							color="primary"
							disabled={!canLock}
							onClick={handleLock}>Lock</Button>
					</Box>
				</Paper>
			</Box>
			<Box marginTop={2}>
				<UnlockWithRevoke
					{...fetched}
					toUnlock={toUnlock}
					onSetToUnlock={setToUnlock}
					onUnlock={handleUnlock}
				/>
			</Box>
			{fetched.pendingWithdrawals.length > 0 &&
			<Box marginTop={2}>
				<PendingWithdrawals
					pendingWithdrawals={fetched.pendingWithdrawals}
					onWithdraw={handleWithdraw}
					onCancel={handleCancelWithdraw}
				/>
			</Box>}
			</>)}
		</Box>
	)
}
export default LockerApp

const UnlockWithRevoke = (props: {
	toUnlock: string
	onSetToUnlock: (v: string) => void,
	totalLocked: BigNumber,
	nonvotingLocked: BigNumber,
	unlockingPeriod: BigNumber,
	votes: GroupVote[],
	isVotingInGovernance: boolean,
	onUnlock: (toUnlock: BigNumber, revoke?: {group: string, amount: BigNumber}) => void,
}) => {
	const toUnlockWEI = new BigNumber(props.toUnlock).shiftedBy(coreErc20Decimals)
	const votesASC = [...props.votes].sort((a, b) =>
		a.active.plus(a.pending)
		.minus(b.active.plus(b.pending))
		.toNumber())
	const handleUnlock = () => {
		const toRevoke = toUnlockWEI.minus(props.nonvotingLocked)
		let revoke
		let _toUnlock = toUnlockWEI
		if (toRevoke.gt(0)) {
			const v = votesASC.find((v) => v.active.plus(v.pending).gte(toRevoke))
			if (v) {
				revoke = {group: v.group, amount: toRevoke}
			} else {
				// This should never happen, but if it does for some reason, still go through with
				// the unlock with maximum possible.
				_toUnlock = _toUnlock.minus(toRevoke)
			}
		}
		props.onUnlock(_toUnlock, revoke)
	}

	const maxToUnlockWEI =
		props.isVotingInGovernance ? new BigNumber(0) :
		props.nonvotingLocked.plus(
			votesASC.length === 0 ? 0 :
			votesASC[votesASC.length - 1].active.plus(votesASC[votesASC.length - 1].pending))
	const canUnlock = (
		toUnlockWEI.gt(0) && maxToUnlockWEI.gte(toUnlockWEI))
	const maxToUnlock = maxToUnlockWEI.shiftedBy(-coreErc20Decimals)
	return (
		<Paper>
			<Box display="flex" flexDirection="column" p={2}>
				<Box marginBottom={1}>
					<Alert severity="info">
						Locked CELO has a delay of {props.unlockingPeriod.div(24*60*60).toString()} days
						before it can be recovered from the escrow after unlock is initiated.
					</Alert>
				</Box>
				<Box marginBottom={1}>
					<Alert severity="info">
						To unlock already voting CELO, multiple transactions might be needed to revoke votes
						first. `Max to unlock` shows maximum amount that can be unlocked in a single transaction.
					</Alert>
				</Box>
				<Table size="small">
					<TableBody>
						<TableRow>
							<TableCell style={{whiteSpace: "nowrap"}}>Locked</TableCell>
							<TableCell width="100%">{fmtAmount(props.totalLocked, "CELO")} CELO</TableCell>
						</TableRow>
						<TableRow>
							<TableCell style={{whiteSpace: "nowrap"}}>Nonvoting</TableCell>
							<TableCell>{fmtAmount(props.nonvotingLocked, "CELO")} CELO</TableCell>
						</TableRow>
						{!props.isVotingInGovernance &&
						<TableRow>
							<TableCell style={{whiteSpace: "nowrap"}}>Max to unlock</TableCell>
							<TableCell>{fmtAmount(maxToUnlockWEI, "CELO")} CELO</TableCell>
						</TableRow>}
					</TableBody>
				</Table>
				{props.isVotingInGovernance ?
				<Box marginTop={1}>
					<Alert severity="error">
						Account is participating in Governance voting. CELO can not be unlocked until Governance
						process is complete.
					</Alert>
				</Box>
				: <>
				<NumberInput
					margin="dense"
					variant="outlined"
					id="unlock-celo-input"
					label={`Unlock (max: ${fmtAmount(maxToUnlockWEI, "CELO")})`}
					value={props.toUnlock}
					onChangeValue={props.onSetToUnlock}
					maxValue={maxToUnlock}
				/>
				<Button
					id="unlock-celo"
					variant="outlined"
					color="primary"
					disabled={!canUnlock}
					onClick={handleUnlock}>
					{toUnlockWEI.gt(props.nonvotingLocked) ? "Revoke and Unlock" : "Unlock"}
				</Button>
				</>}
			</Box>
		</Paper>
	)
}

const PendingWithdrawals = (props: {
	pendingWithdrawals: PendingWithdrawal[],
	onWithdraw: (idx: number) => void,
	onCancel: (idx: number, pending: PendingWithdrawal) => void,
}) => {
	const pendingWithdrawals: [PendingWithdrawal, number][] = props.pendingWithdrawals.map((p, idx) => ([p, idx]))
	pendingWithdrawals.sort((a, b) => (a[0].time.minus(b[0].time).toNumber()))
	const pendingTotal = BigNumber.sum(...pendingWithdrawals.map((p) => p[0].value))
	return (
		<Paper>
			<Box display="flex" flexDirection="column" p={2}>
				<Box marginBottom={1}>
					<Typography>Pending withdrawals: {fmtAmount(pendingTotal, "CELO")} CELO</Typography>
				</Box>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Date</TableCell>
							<TableCell width="100%">Amount</TableCell>
							<TableCell />
							<TableCell />
						</TableRow>
					</TableHead>
					<TableBody>
					{pendingWithdrawals.map((p, idx) => {
						const date = new Date(p[0].time.multipliedBy(1000).toNumber())
						const pendingMinutes = p[0].time.minus(nowMS()/1000).div(60)
						const pendingText = pendingMinutes.lte(90) ?
							`in ${pendingMinutes.toFixed(0)} minutes\u2026`:
							`in ${pendingMinutes.div(60).toFixed(0)} hours\u2026`
						const canWithdraw = pendingMinutes.lte(0)
						return (
						<TableRow key={`${p[1]}`}>
							<Tooltip title={date.toLocaleString()}>
								<TableCell>{date.toLocaleDateString()}</TableCell>
							</Tooltip>
							<TableCell>{fmtAmount(p[0].value, "CELO")}</TableCell>
							<TableCell>
								<Button
									id={`withdraw-${idx}`}
									style={{width: 140}}
									variant="outlined"
									color="primary"
									disabled={!canWithdraw}
									onClick={() => { props.onWithdraw(p[1]) }}
									>{canWithdraw ? "Withdraw" : pendingText}</Button>
							</TableCell>
							<TableCell>
								<Button
									id={`cancel-withdraw-${idx}`}
									style={{width: 130}}
									variant="outlined"
									color="secondary"
									onClick={() => { props.onCancel(p[1], p[0]) }}
									>Cancel</Button>
							</TableCell>
						</TableRow>
						)
					})}
					</TableBody>
				</Table>
			</Box>
		</Paper>
	)
}
