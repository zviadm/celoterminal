import * as React from 'react'
import { Box, Select, Button, MenuItem } from '@material-ui/core'
import { ContractKit, StableToken } from '@celo/contractkit'
import Alert from '@material-ui/lab/Alert'
import { stableTokens, moolaTokens } from './config'
import useLocalStorageState from '../../state/localstorage-state'
import NumberInput from '../../components/number-input'
import { fmtAmount } from '../../../lib/utils'
import BigNumber from 'bignumber.js'
import { coreErc20Decimals, Erc20InfiniteAmount } from '../../../lib/erc20/core'

const Deposit = (
	props: {
		onApprove: (amount: BigNumber) => void
	}
): JSX.Element => {

	const [depositAmount, setDepositAmount] = React.useState("")
	
	return (
		<Box display="flex" flexDirection="column">
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
					onClick={() => props.onApprove(new BigNumber(depositAmount).shiftedBy(coreErc20Decimals))} // TODO-- apporve lending pool
					>
					Deposit
				</Button>
			</div>
		</Box>
	)
}

export default Deposit