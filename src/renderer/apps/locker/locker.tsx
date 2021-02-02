import * as React from 'react'
import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import { PendingWithdrawal } from '@celo/contractkit/lib/wrappers/LockedGold'
import { toWei } from "web3-utils"

import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Alert from '@material-ui/lab/Alert'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import { TableBody, TableContainer } from '@material-ui/core'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import Tooltip from '@material-ui/core/Tooltip'

import AppHeader from '../../components/app-header'

import { Account } from '../../state/accounts'
import useOnChainState from '../../state/onchain-state'
import { fmtAmount } from '../../../lib/utils'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { toTransactionObject } from '@celo/connect'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LockerApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	onError: (e: Error) => void,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		const goldToken = await kit.contracts.getGoldToken()
		const lockedGold = await kit.contracts.getLockedGold()
		const accounts = await kit.contracts.getAccounts()
		const isAccount = await accounts.isAccount(props.selectedAccount.address)
		if (!isAccount) {
			return { isAccount }
		}
		const config = lockedGold.getConfig()
		const totalCELO = goldToken.balanceOf(props.selectedAccount.address)
		const totalLocked = lockedGold.getAccountTotalLockedGold(props.selectedAccount.address)
		const nonvotingLocked = lockedGold.getAccountNonvotingLockedGold(props.selectedAccount.address)
		const pendingWithdrawals = lockedGold.getPendingWithdrawals(props.selectedAccount.address)
		return {
			isAccount,
			unlockingPeriod: (await config).unlockingPeriod,
			totalCELO: await totalCELO,
			totalLocked: await totalLocked,
			nonvotingLocked: await nonvotingLocked,
			pendingWithdrawals: await pendingWithdrawals,
		}
	}, [props.selectedAccount.address], props.onError)
	const [toUnlock, setToUnlock] = React.useState("")
	const [toLock, setToLock] = React.useState("")

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
		runTXs(async (kit: ContractKit) => {
			const lockedGold = await kit.contracts.getLockedGold()
			const tx = lockedGold.lock()
			return [{tx: tx, value: toWei(toLock, 'ether')}]
		})
	}
	const handleUnlock = () => {
		runTXs(async (kit: ContractKit) => {
			const lockedGold = await kit.contracts.getLockedGold()
			const tx = lockedGold.unlock(toWei(toUnlock, 'ether'))
			return [{tx: tx}]
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
		fetched.totalCELO.gte(toWei(toLock, 'ether')))
	const canUnlock = (
		toUnlock !== "" && fetched && fetched.isAccount &&
		fetched.nonvotingLocked.gte(toWei(toUnlock, 'ether')))
	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader title={"Locker"} isFetching={isFetching} refetch={refetch} />
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
						<Typography>Balance: {fmtAmount(fetched.totalCELO, 18)} CELO</Typography>
						<TextField
								autoFocus
								margin="dense"
								label={`Lock (max: ${fmtAmount(fetched.totalCELO, 18)})`}
								variant="outlined"
								value={toLock}
								size="medium"
								type="number"
								fullWidth={true}
								// style={{marginTop: 20}}
								onChange={(e) => { setToLock(e.target.value) }}
							/>
						<Button
							variant="outlined"
							color="primary"
							disabled={!canLock}
							onClick={handleLock}>Lock</Button>
					</Box>
				</Paper>
			</Box>
			<Box marginTop={2}>
				<Paper>
					<Box display="flex" flexDirection="column" p={2}>
						<Box marginBottom={1}>
							<Alert severity="info">
								Locked CELO has a delay of {fetched.unlockingPeriod.div(24*60*60).toString()} days
								before it can be recovered from the escrow after unlock is initiated.
							</Alert>
						</Box>
						<Box marginBottom={1}>
							<Alert severity="info">
								Only non-voting CELO can be unlocked.
							</Alert>
						</Box>
						<Typography>Locked: {fmtAmount(fetched.totalLocked, 18)} CELO</Typography>
						<Typography>Nonvoting: {fmtAmount(fetched.nonvotingLocked, 18)} CELO</Typography>
						<TextField
								margin="dense"
								label={`Unlock (max: ${fmtAmount(fetched.nonvotingLocked, 18)})`}
								variant="outlined"
								value={toUnlock}
								size="medium"
								type="number"
								fullWidth={true}
								onChange={(e) => { setToUnlock(e.target.value) }}
							/>
						<Button
							variant="outlined"
							color="primary"
							disabled={!canUnlock}
							onClick={handleUnlock}>Unlock</Button>
					</Box>
				</Paper>
			</Box>
			{fetched.pendingWithdrawals.length > 0 &&
			<Box marginTop={2}>
				<PendingWithdrawals
					pendingWithdrawals={fetched.pendingWithdrawals}
					unlockingPeriod={fetched.unlockingPeriod}
					onWithdraw={handleWithdraw}
					onCancel={handleCancelWithdraw}
				/>
			</Box>}
			</>)}
		</Box>
	)
}
export default LockerApp

const PendingWithdrawals = (props: {
	pendingWithdrawals: PendingWithdrawal[],
	unlockingPeriod: BigNumber,
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
					<Typography>Pending withdrawals: {fmtAmount(pendingTotal, 18)} CELO</Typography>
				</Box>
				<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Date</TableCell>
							<TableCell width="100%">Amount</TableCell>
							<TableCell />
							<TableCell />
						</TableRow>
					</TableHead>
					<TableBody>
					{pendingWithdrawals.map((p) => {
						const date = new Date(p[0].time.multipliedBy(1000).toNumber())
						const pendingMinutes = p[0].time.plus(props.unlockingPeriod).minus(Date.now()/1000).div(60)
						const pendingText = pendingMinutes.lte(90) ?
							`in ${pendingMinutes.toFixed(0)} minutes...` :
							`in ${pendingMinutes.div(60).toFixed(0)} hours...`
						const canWithdraw = pendingMinutes.lte(0)
						return (
						<TableRow key={`${p[1]}`}>
							<Tooltip title={date.toLocaleString()}>
								<TableCell>{date.toLocaleDateString()}</TableCell>
							</Tooltip>
							<TableCell>{fmtAmount(p[0].value, 18)}</TableCell>
							<TableCell>
								<Button
									style={{width: 150}}
									variant="outlined"
									color="primary"
									disabled={!canWithdraw}
									onClick={() => { props.onWithdraw(p[1]) }}
									>{canWithdraw ? "Withdraw" : pendingText}</Button>
							</TableCell>
							<TableCell>
								<Button
									style={{width: 150}}
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
				</TableContainer>
			</Box>
		</Paper>
	)
}