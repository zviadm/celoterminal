import * as React from 'react'
import { Box, Select, Button, MenuItem, TextField, InputLabel } from '@material-ui/core'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import SectionTitle from '../../components/section-title'
import { availableRateMode } from './config';
import { toBigNumberWei } from './moola-helper'

const CreditDelegationBorrowerSection = (
		{ sectionTitle, type, submitAction, handleSubmit}:
		{
			sectionTitle: string,
			type: string,
			submitAction: string,
			handleSubmit: (address: string, rateMode: number, amount: BigNumber) => void
		}) => {
	
	const [address, setAddress] = React.useState("")
	const [rateMode, setRateMode] = React.useState(1)
	const [amount, setAmount] = React.useState("")

	return (
		<>
			<SectionTitle>{sectionTitle}</SectionTitle>
			<InputLabel style={{ marginTop: 18 }}>Delegator Address to borrow from</InputLabel>
			<TextField
				id={`${type}-address`}
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
				value={address}
				onChange={(event) => { setAddress(event.target.value) }}
			/>
			<InputLabel style={{ marginTop: 18 }}>Rate type</InputLabel>
			<Select
				style={{ width: "100%" }}
				value={rateMode}
				onChange={(event) => { setRateMode(event.target.value as number) }}>
				{
					Object.keys(availableRateMode).map((modeName: string) => (
						<MenuItem value={availableRateMode[modeName as keyof typeof availableRateMode]} key={modeName}>{modeName}</MenuItem>
					))
				}
			</Select>
			<InputLabel style={{ marginTop: 18 }}>Amount</InputLabel>
			<NumberInput
				id={`${type}-input`}
				margin="dense"
				value={amount}
				placeholder="0.0"
				onChangeValue={setAmount}
			/>
			<div style={{ textAlign: "right" }}>
				<Button
					disabled={amount === ''}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
					color="primary"
					onClick={() => handleSubmit(address, rateMode, toBigNumberWei(amount))}
				>
					{submitAction}
				</Button>
			</div>
		</>
	)
}

const CreditDelegationBorrower = (
	props: {
		onBorrowFrom: (delegator: string, reateMode: number, amount: BigNumber) => void,
		onRepayFor: (delegator: string, rateMode: number, amount: BigNumber) => void,
	}
): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<CreditDelegationBorrowerSection
				sectionTitle="Borrow From"
				type="borrow-from"
				submitAction="Borrow"
				handleSubmit={props.onBorrowFrom}
			/>
			<CreditDelegationBorrowerSection
				sectionTitle="Repay For"
				type="repay-for"
				submitAction="Repay"
				handleSubmit={props.onRepayFor}
			/>
		</Box>
	)
}



export default CreditDelegationBorrower