import * as React from 'react'
import { ContractKit } from '@celo/contractkit'
import { toWei } from "web3-utils"

import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Box from '@material-ui/core/Box'

import { Account } from '../../state/accounts'
import useOnChainState from '../../state/onchain-state'
import { fmtAmount } from '../../../common/utils'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import AppHeader from '../../components/app-header'
import Paper from '@material-ui/core/Paper'
import Alert from '@material-ui/lab/Alert'
import BigNumber from 'bignumber.js'

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
		const config = await kit.getNetworkConfig()

		const isAccount = await accounts.isAccount(props.selectedAccount.address)
		if (!isAccount) {
			return { isAccount }
		}
		const unlockingPeriod = config.lockedGold.unlockingPeriod
		const totalCELO = goldToken.balanceOf(props.selectedAccount.address)
		const totalLocked = lockedGold.getAccountTotalLockedGold(props.selectedAccount.address)
		const nonvotingLocked = lockedGold.getAccountNonvotingLockedGold(props.selectedAccount.address)
		const pendingWithdrawals = lockedGold.getPendingWithdrawals(props.selectedAccount.address)
		return {
			isAccount,
			unlockingPeriod,
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
	const txsLock: TXFunc = async (kit: ContractKit) => {
		const lockedGold = await kit.contracts.getLockedGold()
		const tx = lockedGold.lock()
		return [{tx: tx, value: toWei(toLock, 'ether')}]
	}
	const txsUnlock: TXFunc = async (kit: ContractKit) => {
		const lockedGold = await kit.contracts.getLockedGold()
		const tx = lockedGold.unlock(toWei(toUnlock, 'ether'))
		return [{tx: tx}]
	}
	const txsCreateAccount: TXFunc = async (kit: ContractKit) => {
		const accounts = await kit.contracts.getAccounts()
		const tx = accounts.createAccount()
		return [{tx: tx}]
	}
	const handleLock = () => { runTXs(txsLock) }
	const handleUnlock = () => { runTXs(txsUnlock) }
	const handleCreateAccount = () => { runTXs(txsCreateAccount) }

	const canLock = (
		toLock !== "" && fetched && fetched.isAccount &&
		fetched.totalCELO.gte(toWei(toLock, 'ether')))
	const canUnlock = (
		toUnlock !== "" && fetched && fetched.isAccount &&
		fetched.nonvotingLocked.gte(toWei(toUnlock, 'ether')))
	const pendingTotal = BigNumber.sum(...(fetched?.pendingWithdrawals?.map((p) => p.value) || []))
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
			<Box marginTop={2}>
				<Paper>
					<Box display="flex" flexDirection="column" p={2}>
						<Typography>Pending withdrawals: {fmtAmount(pendingTotal, 18)} CELO</Typography>
					</Box>
				</Paper>
			</Box>
			</>)}
		</Box>
	)
}
export default LockerApp
