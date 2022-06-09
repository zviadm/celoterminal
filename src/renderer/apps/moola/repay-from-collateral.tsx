import * as React from 'react'
import { Box, Select, Button, MenuItem, InputLabel } from '@material-ui/core'
import { CeloTokenType } from '@celo/contractkit'
import { moolaTokens } from './config'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { toBigNumberWei } from './moola-helper'
import { availableRateMode } from './config';


const RepayFromCollateral = (
	props: {
		onRepayFromCollateral: (collateralAssetSymbol: string, debtAssetSymbol: string, rateMode: number, amount: BigNumber, useFlashLoan: boolean) => void,
		tokenMenuItems: JSX.Element[],
	}
) => {
	const [amount, setAmount] = React.useState("")
	const [rateMode, setRateMode] = React.useState(1)
	const [collateralAsset, setCollateralAsset] = React.useState(moolaTokens[0].symbol)
	const [debtAsset, setDebtAsset] = React.useState(moolaTokens[1].symbol)
	const [useFlashLoan, toggleUseFlashLoan] = React.useState('NO');

	const hanldeSubmit = () => {
		const useFlashLoanBool = useFlashLoan === 'YES';
		props.onRepayFromCollateral(collateralAsset, debtAsset, rateMode, toBigNumberWei(amount), useFlashLoanBool)
	}

	return (
		<Box>
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<Box style={{ width: '45%' }}>
					<InputLabel>Collateral Asset</InputLabel>
					<Select
						style={{ width: '100%'}}	
						value={collateralAsset}
						onChange={(event) => { setCollateralAsset(event.target.value as CeloTokenType) }}>
						{props.tokenMenuItems}
						</Select>
					</Box>
				<Box style={{ width: '45%' }}>
					<InputLabel>Debt Asset</InputLabel>
					<Select
						style={{ width: '100%'}}	
						value={debtAsset}
						label="hello"
						onChange={(event) => { setDebtAsset(event.target.value as CeloTokenType) }}>
						{props.tokenMenuItems}
						</Select>
				</Box>

			</div>
			<InputLabel style={{ marginTop: 18}}>Rate type</InputLabel>
			<Select
				style={{ width: "100%",  }}
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
				id="repay-from-collateral-amount"
				margin="dense"
				value={amount}
				placeholder="0.0"
				onChangeValue={setAmount}
			/>
			<InputLabel style={{ marginTop: 18}}>Use flashloan</InputLabel>
				<Select
					style={{ width: '100%'}}	
				value={useFlashLoan}
					onChange={(event) => { toggleUseFlashLoan(event.target.value as string) }}>
					<MenuItem value={'NO'} key='use-flash-loan-false'>NO</MenuItem>
					<MenuItem value={'YES'} key='use-flash-loan-true'>YES</MenuItem>
			</Select>
			
				<div style={{ textAlign: "right"}}>
				<Button
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={hanldeSubmit}
					>
					Repay
				</Button>
			</div>
		</Box>
	)
}

export default RepayFromCollateral;