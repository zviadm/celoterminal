import { fmtAmount } from '../../../lib/utils'
import BigNumber from 'bignumber.js'

import { coreErc20Decimals } from '../../../lib/erc20/core'
import { celoToSavingsWithMax } from './utils'

import * as React from 'react'
import { Box, Button } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import NumberInput from '../../components/number-input'
import Link from '../../components/link'

const Withdraw = (props: {
	balance_sCELO: BigNumber,
	sCELOasCELO: BigNumber,
	savingsTotal_CELO: BigNumber,
	savingsTotal_sCELO: BigNumber,
	unlockingPeriod: BigNumber,
	onWithdrawStart: (toWithdraw_sCELO: BigNumber, cb: (e?: Error) => void) => void,
}): JSX.Element => {
	const [toWithdraw, setToWithdraw] = React.useState("")
	const maxToWithdraw = props.sCELOasCELO.shiftedBy(-coreErc20Decimals)
	const canWithdraw = maxToWithdraw.gte(toWithdraw)
	const handleWithdrawStart = () => {
		const toWithdraw_sCELO = celoToSavingsWithMax(
			new BigNumber(toWithdraw).shiftedBy(coreErc20Decimals),
			props.balance_sCELO,
			props.savingsTotal_CELO,
			props.savingsTotal_sCELO,
		)
		props.onWithdrawStart(
			toWithdraw_sCELO,
			(e?: Error) => { if (!e) { setToWithdraw("") } }
		)
	}
	return (
		<Box display="flex" flexDirection="column">
			<Alert severity="info" style={{marginBottom: 10}}>
				Withdraws are delayed by the standard {props.unlockingPeriod.div(24*60*60).toString()} day&nbsp;
				<Link href="https://docs.celo.org/celo-codebase/protocol/proof-of-stake/locked-gold#unlocking-period">
				unlocking period</Link>.
			</Alert>
			<NumberInput
				autoFocus
				margin="normal"
				id="withdraw-celo-input"
				label={`Withdraw (max: ${fmtAmount(props.sCELOasCELO, "CELO")})`}
				InputLabelProps={{shrink: true}}
				value={toWithdraw}
				onChangeValue={setToWithdraw}
				maxValue={maxToWithdraw}
			/>
			<Button
				id="withdraw"
				color="primary"
				variant="outlined"
				disabled={!canWithdraw}
				onClick={handleWithdrawStart}>Withdraw</Button>
		</Box>
	)
}
export default Withdraw
