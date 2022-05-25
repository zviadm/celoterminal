import * as React from 'react'
import { Box, Select, Button, MenuItem } from '@material-ui/core'
import { ContractKit, StableToken } from '@celo/contractkit'
import Alert from '@material-ui/lab/Alert'
import { stableTokens } from './config'
import useLocalStorageState from '../../state/localstorage-state'
import NumberInput from '../../components/number-input'
import { fmtAmount } from '../../../lib/utils'

const Deposit = (): JSX.Element => {
	const [stableToken, setStableToken] = useLocalStorageState<StableToken>("terminal/mento/stable-token", StableToken.cUSD)
	const stableNames = stableTokens.map((t) => t.symbol)
		const handleChangeStable = (t: StableToken) => {
		setStableToken(t)
		}
	const [depositAmount, setDepositAmount] = React.useState("")
	
	return (
		<Box display="flex" flexDirection="column">
			<Select
				value={stableToken}
				onChange={(event) => { handleChangeStable(event.target.value as StableToken) }}>
				{
					stableNames.map((token) => (
						<MenuItem value={token} key={token}>{token}</MenuItem>
					))
				}
			</Select>
			<NumberInput
				id="sell-amount-input"
				margin="normal"
				label="Amount"
				value={depositAmount}
				placeholder="0.0"
				onChangeValue={setDepositAmount}
			/>
			<div style={{ textAlign: "right"}}>
				<Button
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => { console.log('Start deposit')}}
					>
					Deposit
				</Button>
			</div>
		</Box>
	)
}
export default Deposit