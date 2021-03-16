import BigNumber from 'bignumber.js'
import { isValidAddress } from 'ethereumjs-util'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { Account } from '../../../lib/accounts/accounts'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import { Button, LinearProgress } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import AddressAutocomplete from '../../components/address-autocomplete'
import NumberInput from '../../components/number-input'
import useOnChainState from '../../state/onchain-state'
import { ContractKit } from '@celo/contractkit'
import { newErc20 } from '../../../lib/erc20/erc20-contract'

const TransferFromTab = (props: {
	erc20: RegisteredErc20,
	selectedAccount: Account,
	owners: string[],
	addressBook: Account[], // TODO(zviad): This type should be different.
}): JSX.Element => {
	const [owner, setOwner] = React.useState("")
	const [toAddress, setToAddress] = React.useState("")
	const [toSend, setToSend] = React.useState("")

	const erc20 = props.erc20
	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		// refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			if (owner === "") {
				return {}
			}
			const contract = await newErc20(kit, erc20)
			const balance = contract.balanceOf(owner)
			const allowance = contract.allowance(owner, selectedAddress)
			return {
				balance: await balance,
				allowance: await allowance,
			}
		},
		[selectedAddress, erc20, owner]
	))
	const ownerAddrs = props.owners.map((a) => ({address: a}))
	const maxToSend = fetched?.allowance && BigNumber.minimum(fetched.allowance, fetched.balance)
	const canSend = (
		isValidAddress(toAddress) && (toSend !== "") && maxToSend &&
		maxToSend.gte(new BigNumber(toSend).shiftedBy(props.erc20.decimals)))

	// const handleSend = () => { props.onSend(toAddress, toSend) }
	return props.owners.length === 0 ?
		<Alert severity="error">
			No authorized accounts found that can be used as a source to transfer
			funds from.
		</Alert>
		: <>
		<Alert severity="warning">
			Transfers are non-reversible. Transfering funds to an incorrect address
			can lead to permanent loss of your funds.
		</Alert>
		<AddressAutocomplete
			id="from-address-input"
			noFreeSolo={true}
			textFieldProps={{
				label: "From address",
				margin: "normal",
				InputLabelProps: {shrink: true},
			}}
			addresses={ownerAddrs}
			address={owner}
			onChange={setOwner}
		/>
		{isFetching && <LinearProgress />}
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
				!maxToSend ? `Amount` :
				`Amount (max: ${fmtAmount(maxToSend, props.erc20.decimals)})`
			}
			InputLabelProps={{shrink: true}}
			value={toSend}
			onChangeValue={setToSend}
			maxValue={maxToSend?.shiftedBy(-props.erc20.decimals)}
		/>
		<Button
			id="send"
			variant="outlined" color="primary"
			disabled={!canSend}
			onClick={undefined}>Send</Button>
		</>
}
export default TransferFromTab