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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LockerApp = (props: {
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
		const totalCELO = await goldToken.balanceOf(props.selectedAccount.address)
		const totalLocked = await lockedGold.getAccountTotalLockedGold(props.selectedAccount.address)
		const pendingWithdrawals = await lockedGold.getPendingWithdrawals(props.selectedAccount.address)
		return {
			isAccount,
			totalCELO,
			totalLocked,
			pendingWithdrawals,
		}
	}, [props.selectedAccount.address], props.onError)
	const [toUnlock, setToUnlock] = React.useState("")
	const [toLock, setToLock] = React.useState("")

	const runTXs = (f: TXFunc) => { props.runTXs(f, () => { refetch() }) }
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

	return (
		<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
			<AppHeader title={"Locker"} isFetching={isFetching} refetch={refetch} />
			{fetched &&
			(!fetched.isAccount ?
			<div>
				<Box p={2}>
					<Typography>To lock CELO and participate in elections or governance,
						you need to register your address by creating an account first.</Typography>
					<Button onClick={handleCreateAccount}>Create Account</Button>
				</Box>
			</div>
			:
			<div>
				<Box p={2}>
					<Typography>Balance: {fmtAmount(fetched.totalCELO, 18)} CELO</Typography>
					<div style={{display: "flex", flexDirection: "column", width:300}}>
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
						<Button variant="outlined" color="primary" onClick={handleLock}>Lock</Button>
					</div>
				</Box>
				<Box p={2}>
					<Typography>Locked: {fmtAmount(fetched.totalLocked, 18)} CELO</Typography>
					<div style={{display: "flex", flexDirection: "column", width: 300}}>
						<TextField
								margin="dense"
								label={`Unlock (max: ${fmtAmount(fetched.totalLocked, 18)})`}
								variant="outlined"
								value={toUnlock}
								size="medium"
								type="number"
								fullWidth={true}
								// style={{marginTop: 20}}
								onChange={(e) => { setToUnlock(e.target.value) }}
							/>
						<Button variant="outlined" color="primary" onClick={handleUnlock}>Unlock</Button>
					</div>
				</Box>
				<Box p={2}>
					<Typography>Pending withdrawals: {fetched.pendingWithdrawals.length}</Typography>
				</Box>
			</div>)}
		</div>
	)
}
