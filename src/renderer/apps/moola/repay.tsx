import * as React from 'react'
import { Box, Button, Select, MenuItem, InputLabel  } from '@material-ui/core'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { availableRateMode } from './config';
import { toBigNumberWei, BN } from './moola-helper'

const Repay = (
	{  onRepay, tokenBalance, stableDebt, variableDebt }: {
		onRepay: (rateMode: number, amount: BigNumber) => void,
		tokenBalance: BigNumber,
		stableDebt: string,
		variableDebt: string
	}
): JSX.Element => {
	const [rateMode, setRateMode] = React.useState(1)
	const [repayAmount, setRepayAmount] = React.useState("")

	const totalDebt =  rateMode === 1 ? new BigNumber(stableDebt) : new BigNumber(stableDebt);
	const maxRepayAmount = BN(tokenBalance).isLessThan(totalDebt) ? tokenBalance : totalDebt;
	console.log('totalDebt :>> ', totalDebt);
	console.log('totalDebt :>> ', stableDebt, variableDebt);

	return (
		<Box display="flex" flexDirection="column">
			<InputLabel>Rate type</InputLabel>
			<Select
				style={{ width: "100%"}}
				value={rateMode}
				onChange={(event) => { setRateMode(event.target.value as number) }}>
				{
					Object.keys(availableRateMode).map((modeName: string) => (
						<MenuItem value={availableRateMode[modeName as keyof typeof availableRateMode]} key={modeName}>{modeName}</MenuItem>
					))
				}
			</Select>
			<InputLabel style={{ marginTop: 18}}>Amount to repay</InputLabel>
			<NumberInput
				id="sell-amount-input"
				margin="dense"
				value={repayAmount}
				placeholder="0.0"
				onChangeValue={setRepayAmount}
				maxValue={maxRepayAmount } 
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					disabled={repayAmount === ''}
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => onRepay(rateMode, toBigNumberWei(repayAmount))}
					>
					Repay
				</Button>
			</div>
		</Box>
	)
}
export default Repay