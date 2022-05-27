import * as React from 'react'
import { Box, Button, Select, MenuItem  } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { coreErc20Decimals, Erc20InfiniteAmount } from '../../../lib/erc20/core'
import { availableRateMode } from './config';

const Repay = (
		props: {
		onRepay: (rateMode: number, amount: BigNumber) => void
	}
): JSX.Element => {
	const [rateMode, setRateMode] = React.useState(1)
	const [repayAmount, setRepayAmount] = React.useState("")

	return (
		<Box display="flex" flexDirection="column">
			<Select
				style={{ width: "100%"}}
				value={rateMode}
				onChange={(event) => { setRateMode(event.target.value) }}>
				{
					Object.keys(availableRateMode).map((modeName: string) => (
						<MenuItem value={availableRateMode[modeName]} key={modeName}>{modeName}</MenuItem>
					))
				}
			</Select>
			<NumberInput
				id="sell-amount-input"
				margin="normal"
				label="Amount"
				value={repayAmount}
				placeholder="0.0"
				onChangeValue={setRepayAmount}
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => props.onRepay(rateMode, new BigNumber(repayAmount).shiftedBy(coreErc20Decimals))}
					>
					Repay
				</Button>
			</div>
		</Box>
	)
}
export default Repay