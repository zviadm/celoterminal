import * as React from 'react'
import { Box, Select, Button , InputLabel, MenuItem, Tooltip } from '@material-ui/core'
import { CeloTokenType } from '@celo/contractkit'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import {  moolaToken } from './moola-helper'

const LiquiditySwap = (
	{ tokenName, onLiquiditySwap, tokenMenuItems, toTokens }: {
		tokenName: string,
		onLiquiditySwap: (assetToSymbol: string, amount: BigNumber) => void,
		tokenMenuItems: JSX.Element[],
		toTokens: moolaToken[]
	}
) => {
	
	const [amount, setAmount] = React.useState("")
	const [toToken, setToToken] = React.useState(toTokens[0].symbol)

	return (
		<Box display="flex" flexDirection="column">
			<div style={{ display: 'flex', justifyContent: 'space-between' }}> 
				<Box style={{ width: '45%'}}	>
				<InputLabel>Asset From</InputLabel>
				<Tooltip title="Please select from token in the above section">
				<Select
					disabled
					style={{ width: '100%'}}	
						value={tokenName}>
					<MenuItem value={tokenName}>{tokenName}</MenuItem>
					</Select>
					</Tooltip>
				</Box>
				<Box style={{ width: '45%'}}	>
					<InputLabel>Asset To</InputLabel>
					<Select
						style={{ width: '100%'}}	
						value={toToken}
						onChange={(event) => { setToToken(event.target.value as CeloTokenType) }}>
						{tokenMenuItems}
					</Select>
					</Box>
			</div>
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
					disabled={}
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => onLiquiditySwap(toToken, toBigNumberWei(amount))}
					>
					Swap
				</Button>
			</div>
		</Box>
	)
}

export default LiquiditySwap;