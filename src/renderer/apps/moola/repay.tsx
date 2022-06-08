import * as React from 'react'
import { Box, Button, Select, MenuItem, InputLabel  } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { coreErc20Decimals, Erc20InfiniteAmount } from '../../../lib/erc20/core'
import { availableRateMode } from './config';
import { toBigNumberWei } from './moola-helper'

const Repay = (
		props: {
		onRepay: (rateMode: number, amount: BigNumber) => void,
		tokenBalance: BigNumber,
	}
): JSX.Element => {
	const [rateMode, setRateMode] = React.useState(1)
	const [repayAmount, setRepayAmount] = React.useState("")

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
				maxValue={props.tokenBalance}
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => props.onRepay(rateMode, toBigNumberWei(repayAmount))}
					>
					Repay
				</Button>
			</div>
		</Box>
	)
}
export default Repay