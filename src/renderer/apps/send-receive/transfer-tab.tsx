import BigNumber from 'bignumber.js'
import { isValidAddress } from 'ethereumjs-util'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { Account } from '../../../lib/accounts/accounts'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import { Button } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import AddressAutocomplete from '../../components/address-autocomplete'
import NumberInput from '../../components/number-input'

const TransferTab = (props: {
	erc20: RegisteredErc20,
	balance?: BigNumber,
	maxToSend?: BigNumber,
	addressBook: Account[], // TODO(zviad): This type should be different.
	onSend: (toAddress: string, toSend: string) => void,
}): JSX.Element => {
	const [toSend, setToSend] = React.useState("")
	const [toAddress, setToAddress] = React.useState("")
	const canSend = (
		isValidAddress(toAddress) && (toSend !== "") && props.maxToSend &&
		props.maxToSend.gte(new BigNumber(toSend).shiftedBy(props.erc20.decimals)))
	const handleSend = () => { props.onSend(toAddress, toSend) }
	return (<>
		<Alert severity="warning">
			Transfers are non-reversible. Transfering funds to an incorrect address
			can lead to permanent loss of your funds.
		</Alert>
		<AddressAutocomplete
			id="to-address-input"
			textFieldProps={{
				label: "Destination address",
				margin: "normal",
				InputLabelProps: {shrink: true},
			}}
			addresses={props.addressBook}
			address={toAddress}
			onChange={setToAddress}
		/>
		<NumberInput
			margin="normal"
			id="amount-input"
			label={
				!props.balance ? `Amount` :
				`Amount (max: ${fmtAmount(props.balance, props.erc20.decimals)})`
			}
			InputLabelProps={{shrink: true}}
			value={toSend}
			onChangeValue={setToSend}
			maxValue={props.maxToSend?.shiftedBy(-props.erc20.decimals)}
		/>
		<Button
			id="send"
			variant="outlined" color="primary"
			disabled={!canSend}
			onClick={handleSend}>Send</Button>
	</>)
}
export default TransferTab