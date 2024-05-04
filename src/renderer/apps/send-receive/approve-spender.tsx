import BigNumber from 'bignumber.js'
import { isValidAddress } from 'ethereumjs-util'

import { Erc20InfiniteAmount, RegisteredErc20 } from '../../../lib/erc20/core'
import { Account } from '../../../lib/accounts/accounts'

import * as React from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core'
import NumberInput from '../../components/number-input'
import { monospaceFont } from '../../styles'

const ApproveSpender = (props: {
	erc20: RegisteredErc20,
	account: Account,
	spender?: string,
	currentAllowance?: BigNumber,
	onCancel: () => void,
	onApprove: (spender: string, amount: BigNumber) => void,
}): JSX.Element => {
	const [spender, setSpender] = React.useState(props.spender || "")
	const [toApprove, setToApprove] = React.useState(
		props.currentAllowance?.shiftedBy(-props.erc20.decimals).toString(10) || "")

	const canApprove = isValidAddress(spender) && new BigNumber(toApprove).gte(0)
	const maxApprove = Erc20InfiniteAmount.shiftedBy(-props.erc20.decimals)
	const handleApprove = () => {
		const amount = new BigNumber(toApprove).shiftedBy(props.erc20.decimals)
		props.onApprove(spender, amount)
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>{props.spender ? "Change amount" : "Approve new spender"}</DialogTitle>
			<DialogContent>
				<TextField
					autoFocus
					id="spender-input"
					margin="dense"
					size="medium"
					fullWidth={true}
					InputLabelProps={{shrink: true}}
					label="Spender address"
					inputProps={{style: {...monospaceFont}}}
					placeholder="0x..."
					disabled={!!props.spender}
					value={spender}
					onChange={(e) => { setSpender(e.target.value) }}
				/>
				<NumberInput
					margin="normal"
					id="amount-input"
					label={`${props.erc20.symbol} amount`}
					InputLabelProps={{shrink: true}}
					value={toApprove}
					onChangeValue={setToApprove}
					maxValue={maxApprove}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button
					id="confirm-approve"
					disabled={!canApprove}
					onClick={handleApprove}>
					{props.spender ? "Change" : "Approve"}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
export default ApproveSpender