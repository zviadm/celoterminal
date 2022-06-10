import * as React from 'react'
import { Box, Button } from '@material-ui/core'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { toBigNumberWei } from './moola-helper'

const Withdraw = (
	{totalDeposited, onWithdraw }: {
		totalDeposited: string,
		onWithdraw: (amount: BigNumber) => void
	}
): JSX.Element => {
		const [withdrawAmount, setwithDrawAmount] = React.useState("")

	return (
		<Box display="flex" flexDirection="column">
			<NumberInput
				id="sell-amount-input"
				margin="normal"
				label="Amount"
				value={withdrawAmount}
				placeholder="0.0"
				onChangeValue={setwithDrawAmount}
				maxValue={new BigNumber(totalDeposited)}
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					disabled={withdrawAmount === ''}
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => onWithdraw(toBigNumberWei(withdrawAmount))} // TODO-- apporve lending pool
					>
					Withdraw
				</Button>
			</div>
		</Box>
	)
}
export default Withdraw