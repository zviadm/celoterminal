import * as React from 'react'
import { Box, Select, Button, MenuItem, TextField, InputLabel } from '@material-ui/core'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { availableRateMode } from './config';
import { toBigNumberWei } from './moola-helper'

const CreditDelegationDeleagtor = (
	props: {
		onDelegate: (borrowerAddress: string, rateMode: number, amount: BigNumber) => void,
	}
): JSX.Element => {

	const [borrowerAddress, setBorrowerAddress] = React.useState("")
	const [rateMode, setRateMode] = React.useState(1)
	const [delegateAmount, setDelegateAmount] = React.useState("")

	return (
		<Box display="flex" flexDirection="column">
			<InputLabel>Borrower address to delegate to</InputLabel>
			<TextField
				id="delegation-borrower-address"
				autoFocus
				InputLabelProps={{ shrink: true }}
				placeholder="0x..."
				size="medium"
				fullWidth={true}
				spellCheck={false}
				inputProps={{
					spellCheck: false,
					style: { fontFamily: "monospace" }
				}}
				value={borrowerAddress}
				onChange={(event) => { setBorrowerAddress(event.target.value) }}
			/>
			<InputLabel style={{marginTop: 18}}>Rate type</InputLabel>
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
			<InputLabel style={{marginTop: 18}}>Amount</InputLabel>
			<NumberInput
				id="sell-amount-input"
				margin="dense"
				value={delegateAmount}
				placeholder="0.0"
				onChangeValue={setDelegateAmount}
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					disabled={delegateAmount === ''}
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => props.onDelegate(borrowerAddress, rateMode, toBigNumberWei(delegateAmount))}
					>
					Delegate
				</Button>
			</div>
		</Box>
	)
}

export default CreditDelegationDeleagtor