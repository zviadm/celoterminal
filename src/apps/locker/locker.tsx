import * as React from 'react'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'

import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/Button'

import { Account } from '../../state/accounts-state'
import useGlobalState from '../../state/global-state'
import useOnChainState from '../../state/onchain-state'
import { CancelPromise, fmtCELOAmt, sleep } from '../../utils'
import useLocalStorageState from '../../state/localstorage-state'
import LinearProgress from '@material-ui/core/LinearProgress'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Box from '@material-ui/core/Box'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LockerApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
}): JSX.Element => {
	const {
		isFetching,
		fetched,
		fetchError,
		refetch,
	} = useOnChainState(async (kit: ContractKit, c: CancelPromise) => {
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
	const [toUnlock, setToUnlock] = React.useState(0)
	const [toLock, setToLock] = React.useState(0)

	return (
		<div>{
			(!fetched && !fetchError) ? <LinearProgress /> :
			fetchError ? <div>Error: {fetchError}</div> :
			<div>
				<Box p={2}>
					<Typography>CELO Balance: {fmtCELOAmt(fetched.totalCELO)}</Typography>
					<div style={{display: "flex", flexDirection: "row"}}>
						<TextField
								autoFocus
								margin="dense"
								label={`Lock CELO (max: ${fmtCELOAmt(fetched.totalCELO)})`}
								variant="outlined"
								value={toLock}
								size="medium"
								type="number"
								fullWidth={true}
								// style={{marginTop: 20}}
								onChange={(e) => { setToLock(Number.parseFloat(e.target.value)) }}
							/>
						<Button>Lock</Button>
					</div>
				</Box>
				<Box p={2}>
					<Typography>CELO Locked: {fmtCELOAmt(fetched.totalLocked)}</Typography>
					<div style={{display: "flex", flexDirection: "row"}}>
						<TextField
								autoFocus
								margin="dense"
								label={`Unlock CELO (max: ${fmtCELOAmt(fetched.totalLocked)})`}
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
