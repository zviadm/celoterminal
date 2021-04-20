import { fmtAmount } from '../../../lib/utils'
import BigNumber from 'bignumber.js'

import { coreErc20Decimals } from '../../../lib/erc20/core'

import * as React from 'react'
import { Box, Button } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import NumberInput from '../../components/number-input'
import Link from '../../components/link'

const Deposit = (props: {
	balance_CELO: BigNumber,
	ubeswapPoolURL: string,
	onDeposit: (toDeposit_CELO: BigNumber, cb: (e?: Error) => void) => void,
}): JSX.Element => {
	const [toDeposit, setToDeposit] = React.useState("")
	const maxToDeposit = BigNumber.maximum(
		props.balance_CELO.shiftedBy(-coreErc20Decimals).minus(0.001), 0)
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
				Deposit action automatically chooses between depositing CELO to SavingsCELO contract
				to receive equivalent amount of sCELO tokens, or trading CELO for sCELO through <Link href={props.ubeswapPoolURL}>
				Ubeswap CELO+sCELO pool.</Link><br /><br />
				You are guaranteed to receive at least equivalent amount of sCELO tokens, but you might also receive more
				if there is cheap sCELO available in the Ubeswap pool.
			</Alert>
			<NumberInput
				autoFocus
				margin="normal"
				id="deposit-celo-input"
				label={`Deposit (max: ${fmtAmount(props.balance_CELO, "CELO")} CELO)`}
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