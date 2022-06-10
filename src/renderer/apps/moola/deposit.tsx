import * as React from 'react'
import { Box, Button } from '@material-ui/core'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { toBigNumberWei } from './moola-helper'

const Deposit = (
	props: {
		onDeposit: (amount: BigNumber) => void,
		tokenBalance: BigNumber,
	}
): JSX.Element => {

	const [depositAmount, setDepositAmount] = React.useState("")

	const buttonDisalbed = depositAmount === '';

	return (
		<Box display="flex" flexDirection="column">
			<NumberInput
				id="sell-amount-input"
				margin="normal"
				label="Amount"
				value={depositAmount}
				placeholder="0.0"
				onChangeValue={setDepositAmount}
				maxValue={props.tokenBalance}
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					disabled={buttonDisalbed}
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => props.onDeposit(toBigNumberWei(depositAmount))} // TODO-- apporve lending pool
					>
					Deposit
				</Button>
			</div>
		</Box>
	)
}

export default Deposit