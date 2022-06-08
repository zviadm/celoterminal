import * as React from 'react'
import { Box, Button } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { coreErc20Decimals, Erc20InfiniteAmount } from '../../../lib/erc20/core'
import { toBigNumberWei } from './moola-helper'

const Withdraw = (
	props: {
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
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => props.onWithdraw(toBigNumberWei(withdrawAmount))} // TODO-- apporve lending pool
					>
					Withdraw
				</Button>
			</div>
		</Box>
	)
}
export default Withdraw