import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { isValidAddress } from 'ethereumjs-util'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { Account } from '../../../lib/accounts/accounts'
import { fmtAmount } from '../../../lib/utils'
import { newErc20 } from '../../../lib/erc20/erc20-contract'
import useOnChainState from '../../state/onchain-state'

import * as React from 'react'
import { Box, Button } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import AddressAutocomplete from '../../components/address-autocomplete'
import NumberInput from '../../components/number-input'
import HiddenProgress from './hidden-progress'

const TransferFromTab = (props: {
	erc20: RegisteredErc20,
	account: Account,
	accountData: {
		owners: string[],
		incompleteBlockN?: number,
	},
	addressBook: Account[], // TODO(zviad): This type should be different.
	resetAmounts: number,
	onSend: (from: string, to: string, amount: BigNumber) => void,
}): JSX.Element => {
	const [owner, setOwner] = React.useState("")
	const [toAddress, setToAddress] = React.useState("")
	const [toSend, setToSend] = React.useState("")
	const resetAmounts = props.resetAmounts
	React.useEffect(() => { setToSend("") }, [resetAmounts])

	const erc20 = props.erc20
	const selectedAddress = props.account.address
	const {
		isFetching,
		fetched,
		refetch,
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
	// When `accountData` changes, trigger a refech since underlying on-chain data has
	// most likely changed.
	// has most likely changed.
	const accountData = props.accountData
	const accountDataRef = React.useRef(accountData)
	React.useEffect(() => {
		if (accountDataRef.current !== accountData) {
			accountDataRef.current = accountData
			refetch()
		}
	}, [refetch, accountData])
	const ownerAddrs = accountData.owners.map((a) => ({address: a}))
	const maxToSend = fetched?.allowance && BigNumber.minimum(fetched.allowance, fetched.balance)
	const canSend = (
		isValidAddress(toAddress) && (toSend !== "") && maxToSend &&
		maxToSend.gte(new BigNumber(toSend).shiftedBy(props.erc20.decimals)))

	const handleSend = () => {
		const amount = new BigNumber(toSend).shiftedBy(props.erc20.decimals)
		props.onSend(owner, toAddress, amount)
	}
	return <>
		{props.accountData.incompleteBlockN &&
		<Box display="flex" flexDirection="column" marginBottom={2}>
			<Alert severity="warning">
				Approval/spender data was only fetched from block number {props.accountData.incompleteBlockN}.
				Accounts authorized earlier than that might not be listed. You can try clicking the refresh button
				to try fetching approval data again.
			</Alert>
		</Box>}
		{
			accountData.owners.length === 0 ?
			<Alert severity="error">
				No authorized accounts found that can be used as a source to transfer
				funds from.
			</Alert>
			: <>
			<Alert severity="warning">
				Transfers are non-reversible. Transferring funds to an incorrect address
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
				onChange={setOwner}
			/>
			<HiddenProgress hidden={!isFetching} />
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
				onClick={handleSend}>Send</Button>
			</>
	}
	</>
}
export default TransferFromTab