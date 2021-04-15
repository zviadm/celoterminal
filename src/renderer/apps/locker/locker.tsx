import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import { PendingWithdrawal } from '@celo/contractkit/lib/wrappers/LockedGold'
import { GroupVote } from '@celo/contractkit/lib/wrappers/Election'
import { toTransactionObject } from '@celo/connect'

import { Account } from '../../../lib/accounts/accounts'
import useOnChainState from '../../state/onchain-state'
import { fmtAmount } from '../../../lib/utils'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { Locker } from './def'
import { coreErc20Decimals } from '../../../lib/erc20/core'
import useLocalStorageState from '../../state/localstorage-state'

import * as React from 'react'
import {
	Button, Box, Table, TableBody,
	TableCell, TableRow, Tab
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'

import AppHeader from '../../components/app-header'
import NumberInput from '../../components/number-input'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import PendingWithdrawals from './pending-withdrawals'
import Link from '../../components/link'

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
	const [tab, setTab] = useLocalStorageState("terminal/locker/tab", "lock")
	const [toLock, setToLock] = React.useState("")
	const [toUnlock, setToUnlock] = React.useState("")
	const toLockWEI = new BigNumber(toLock).shiftedBy(coreErc20Decimals)

	const onFinishTXs = (e?: Error) => {
		refetch()
		if (!e) {
			setToLock("")
			setToUnlock("")
		}
	}
	const handleCreateAccount = () => {
		props.runTXs(
			async (kit: ContractKit) => {
				const accounts = await kit.contracts.getAccounts()
				const tx = accounts.createAccount()
				return [{tx: tx}]
			},
			onFinishTXs
		)
	}
	const handleLock = () => {
		props.runTXs(
			async (kit: ContractKit) => {
				const lockedGold = await kit.contracts.getLockedGold()
				const tx = lockedGold.lock()
				return [{tx: tx, params: {value: toLockWEI.toFixed(0)}}]
			},
			onFinishTXs,
		)
	}
	const handleUnlock = (
		toUnlock: BigNumber,
		revoke?: {group: string, amount: BigNumber},
		) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const lockedGold = await kit.contracts.getLockedGold()
				const election = await kit.contracts.getElection()
				const txs = []
				if (revoke) {
					const revokeTXs = await election.revoke(account.address, revoke.group, revoke.amount)
					txs.push(...revokeTXs)
				}
				txs.push(lockedGold.unlock(toUnlock))
				return txs.map((tx) => ({tx: tx}))
			},
			onFinishTXs,
		)
	}
	const handleWithdraw = (idx: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const lockedGold = await kit.contracts.getLockedGold()
				const tx = lockedGold.withdraw(idx)
				return [{tx: tx}]
			},
			onFinishTXs,
		)
	}
	const handleCancelWithdraw = (idx: number, pending: PendingWithdrawal) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const lockedGold = await kit._web3Contracts.getLockedGold()
				const txo = lockedGold.methods.relock(idx, pending.value.toFixed(0))
				const tx = toTransactionObject(kit.connection, txo)
				return [{tx: tx}]
			},
			onFinishTXs,
		)
	}

	const canLock = (
		toLock !== "" && fetched && fetched.isAccount &&
		toLockWEI.gt(0) && fetched.totalCELO.gte(toLockWEI))
	// TODO(zviadm): only keep extra CELO if current feeCurrency is set as CELO.
	// Keep at least 0.0001 CELO unlocked to avoid running out of Gas completely.
	const maxToLock = fetched?.totalCELO && BigNumber.maximum(
		fetched.totalCELO.shiftedBy(-coreErc20Decimals).minus(0.0001), 0)
	return (
		<AppContainer>
			<AppHeader app={Locker} isFetching={isFetching} refetch={refetch} />
			{fetched &&
			(!fetched.isAccount ?
			<AppSection>
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
			</AppSection>
			:
			<>
			<TabContext value={tab}>
				<AppSection innerPadding={0}>
					<TabList onChange={(e, v) => { setTab(v) }}>
						<Tab label="Lock" value={"lock"} />
						<Tab label="Unlock" value={"unlock"} />
					</TabList>
					<TabPanel value="lock">
						<Box display="flex" flexDirection="column">
							<Box marginBottom={1}>
								<Alert severity="info">
									To particiapte in validator elections, earn voting rewards, or vote on governance,
									CELO needs to be locked up in the LockedGold smart contract. <Link
										href="https://docs.celo.org/celo-codebase/protocol/proof-of-stake/locked-gold">Learn more.</Link>
								</Alert>
							</Box>
							<NumberInput
								autoFocus
								margin="normal"
								id="lock-celo-input"
								label={`Lock (max: ${fmtAmount(fetched.totalCELO, "CELO")})`}
								InputLabelProps={{shrink: true}}
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
					</TabPanel>
					<TabPanel value="unlock">
						<UnlockWithRevoke
							{...fetched}
							toUnlock={toUnlock}
							onSetToUnlock={setToUnlock}
							onUnlock={handleUnlock}
						/>
					</TabPanel>
				</AppSection>
			</TabContext>
			{tab === "unlock" && fetched.pendingWithdrawals.length > 0 &&
			<AppSection>
				<PendingWithdrawals
					pendingWithdrawals={fetched.pendingWithdrawals}
					onWithdraw={handleWithdraw}
					onCancel={handleCancelWithdraw}
				/>
			</AppSection>}
			</>)}
		</AppContainer>
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
		<Box display="flex" flexDirection="column">
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
				autoFocus
				margin="normal"
				id="unlock-celo-input"
				label={`Unlock (max: ${fmtAmount(maxToUnlockWEI, "CELO")})`}
				InputLabelProps={{shrink: true}}
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
	)
}
