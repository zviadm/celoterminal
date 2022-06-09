import * as React from 'react'
import { Box, Select, Button , InputLabel} from '@material-ui/core'
import { CeloTokenType } from '@celo/contractkit'
import { moolaTokens } from './config'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { toBigNumberWei } from './moola-helper'

const LiquiditySwap = (
		props: {
		onLiquiditySwap: (assetToSymbol: string, amount: BigNumber) => void,
		tokenMenuItems: JSX.Element[],
	}
) => {
	
	const [amount, setAmount] = React.useState("")
	const [toToken, setToToken] = React.useState(moolaTokens[1].symbol)

	return (
		<Box display="flex" flexDirection="column">
					<InputLabel>Asset To</InputLabel>
					<Select
						style={{ width: '100%'}}	
						value={toToken}
						onChange={(event) => { setToToken(event.target.value as CeloTokenType) }}>
						{props.tokenMenuItems}
						</Select>
			<NumberInput
				id="liquidity-swap-amount"
				margin="normal"
				label="Amount to swap"
				value={amount}
				placeholder="0.0"
				onChangeValue={setAmount}
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => props.onLiquiditySwap(toToken, toBigNumberWei(amount))}
					>
					Swap
				</Button>
			</div>
		</Box>
	)
}

export default LiquiditySwap;