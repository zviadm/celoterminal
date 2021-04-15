import { fmtAmount } from '../../../lib/utils'
import BigNumber from 'bignumber.js'

import { coreErc20Decimals } from '../../../lib/erc20/core'

import * as React from 'react'
import { Box, Button } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import NumberInput from '../../components/number-input'

const Deposit = (props: {
	balance_CELO: BigNumber,
	onDeposit: (toDeposit_CELO: BigNumber, cb: (e?: Error) => void) => void,
}): JSX.Element => {
	const [toDeposit, setToDeposit] = React.useState("")
	const maxToDeposit = BigNumber.maximum(
		props.balance_CELO.shiftedBy(-coreErc20Decimals).minus(0.0001), 0)
	const canDeposit = maxToDeposit.gte(toDeposit)
	const handleDeposit = () => {
		props.onDeposit(
			new BigNumber(toDeposit).shiftedBy(coreErc20Decimals),
			(e?: Error) => { if (!e) { setToDeposit("") } }
		)
	}
	return (
		<Box display="flex" flexDirection="column">
			<Alert severity="info" style={{marginBottom: 10}}>
				If you want to provide liquidity to CELO+sCELO Ubeswap pool, go to the Ubeswap
				tab directly. From there, you can safely convert portion of your CELO to
				sCELO and add liquidity to the Ubeswap pool in correct proportions, all in a single transaction.
			</Alert>
			<NumberInput
				autoFocus
				margin="normal"
				id="deposit-celo-input"
				label={`Deposit (max: ${fmtAmount(props.balance_CELO, "CELO")})`}
				InputLabelProps={{shrink: true}}
				value={toDeposit}
				onChangeValue={setToDeposit}
				maxValue={maxToDeposit}
			/>
			<Button
				id="deposit"
				color="primary"
				variant="outlined"
				disabled={!canDeposit}
				onClick={handleDeposit}>Deposit</Button>
		</Box>
	)
}
export default Deposit