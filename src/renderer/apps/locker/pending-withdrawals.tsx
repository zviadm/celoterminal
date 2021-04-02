import BigNumber from 'bignumber.js'
import { PendingWithdrawal } from '@celo/contractkit/lib/wrappers/LockedGold'

import { fmtAmount } from '../../../lib/utils'
import { nowMS } from '../../state/time'

import * as React from 'react'
import {
	Button, Typography, Box, Table, TableHead, TableBody,
	TableCell, TableRow, Tooltip
} from '@material-ui/core'

const PendingWithdrawals = (props: {
	pendingWithdrawals: PendingWithdrawal[],
	onWithdraw: (idx: number) => void,
	onCancel: (idx: number, pending: PendingWithdrawal) => void,
}): JSX.Element => {
	const pendingWithdrawals: [PendingWithdrawal, number][] = props.pendingWithdrawals.map((p, idx) => ([p, idx]))
	pendingWithdrawals.sort((a, b) => (a[0].time.minus(b[0].time).toNumber()))
	const pendingTotal = BigNumber.sum(...pendingWithdrawals.map((p) => p[0].value))
	return (<>
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
	</>)
}
export default PendingWithdrawals