import * as React from 'react'
import { ContractKit } from '@celo/contractkit'

import Button from '@material-ui/core/Button'
import LinearProgress from '@material-ui/core/LinearProgress'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Box from '@material-ui/core/Box'

import { Account } from '../../state/accounts-state'
import useOnChainState from '../../state/onchain-state'
import { fmtCELOAmt } from '../../utils'
import { TXFunc } from '../../tx-runner/tx-runner'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LockerApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc) => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const {
		isFetching,
		fetched,
		fetchError,
		// refetch,
	} = useOnChainState(async (kit: ContractKit) => {
		const goldToken = await kit.contracts.getGoldToken()
		const lockedGold = await kit.contracts.getLockedGold()

		const totalCELO = await goldToken.balanceOf(props.selectedAccount.address)
		const totalLocked = await lockedGold.getAccountTotalLockedGold(props.selectedAccount.address)
		const pendingWithdrawals = await lockedGold.getPendingWithdrawals(props.selectedAccount.address)
		return {
			totalCELO,
			totalLocked,
			pendingWithdrawals,
		}
	}, [props.selectedAccount.address])
	const onError = props.onError
	React.useEffect(() => {
		if (fetchError) {
			onError(fetchError)
		}
	}, [fetchError, onError])
	const [toUnlock, setToUnlock] = React.useState(0)
	const [toLock, setToLock] = React.useState(0)

	const createLockTXs: TXFunc = async (kit: ContractKit) => {
		const lockedGold = await kit.contracts.getLockedGold()
		const tx = lockedGold.lock()
		return [{
			tx: tx,
			value: toLock,
		}]
	}

	return (
		<div style={{display: "flex", flex: 1}}>
			{isFetching || <LinearProgress />}
			{fetched &&
			<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
				<Box p={2}>
					<Typography>CELO Balance: {fmtCELOAmt(fetched.totalCELO)}</Typography>
					<div style={{display: "flex", flexDirection: "row"}}>
						<TextField
								autoFocus
								margin="dense"
								label={`Lock (max: ${fmtCELOAmt(fetched.totalCELO)})`}
								variant="outlined"
								value={toLock}
								size="medium"
								type="number"
								fullWidth={true}
								// style={{marginTop: 20}}
								onChange={(e) => { setToLock(Number.parseFloat(e.target.value)) }}
							/>
						<Button onClick={() => { props.runTXs(createLockTXs) }}>Lock</Button>
					</div>
				</Box>
				<Box p={2}>
					<Typography>CELO Locked: {fmtCELOAmt(fetched.totalLocked)}</Typography>
					<div style={{display: "flex", flexDirection: "row"}}>
						<TextField
								autoFocus
								margin="dense"
								label={`Unlock (max: ${fmtCELOAmt(fetched.totalLocked)})`}
								variant="outlined"
								value={toUnlock}
								size="medium"
								type="number"
								fullWidth={true}
								// style={{marginTop: 20}}
								onChange={(e) => { setToUnlock(Number.parseFloat(e.target.value)) }}
							/>
						<Button>Unlock</Button>
					</div>
					<Typography>Pending withdrawals: {fetched.pendingWithdrawals.length}</Typography>
				</Box>
			</div>}
		</div>
	)
}
