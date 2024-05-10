import { AbiItem } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { coreErc20Decimals } from '../../../lib/erc20/core'

import * as React from 'react'
import {
	Button, Box, TextField,
} from '@material-ui/core'
import { monospaceFont } from '../../styles'

const ContractCallInputs = (props: {
	abi: AbiItem,
	actionLabel: string,
	disabled?: boolean,
	onAction: (inputs: (string | string[])[], value?: BigNumber) => void,
}): JSX.Element => {
	const [inputs, setInputs] = React.useState<{[key: number]: string | undefined}>({})
	const [sendAmount, setSendAmount] = React.useState("")
	const handleAction = () => {
		const inps = props.abi.inputs?.map(
			(inputABI, idx) => {
				const isArray = inputABI.type.endsWith("[]")
				const input = inputs[idx] || ""
				return !isArray ? input : input.split(",")
			}
		) || []
		props.onAction(
			inps,
			sendAmount ? new BigNumber(sendAmount).shiftedBy(coreErc20Decimals) : undefined)
	}

	return (<Box display="flex" flexDirection="column">
		{
			props.abi.inputs?.map((input, idx) => {
				return (
					<TextField
						key={idx}
						id={`contract-${props.abi.name}-${input.name}-input`}
						label={`${input.name || "<input>"} (${input.type})`}
						InputLabelProps={{shrink: true}}
						size="medium"
						fullWidth={true}
						spellCheck={false}
						inputProps={{
							spellCheck: false,
							style: {...monospaceFont},
						}}
						margin="dense"
						style={{marginBottom: 10}}
						value={inputs[idx] || ""}
						onChange={(event) => { setInputs((inputs) => ({...inputs, [idx]: event.target.value})) }}
					/>
				)
			})
		}
		{(props.abi.payable || props.abi.stateMutability === "payable") &&
		<TextField
			id={`contract-${props.abi.name}-send-amount-input`}
			label={`<send amount> (CELO)`}
			InputLabelProps={{shrink: true}}
			size="medium"
			fullWidth={true}
			spellCheck={false}
			inputProps={{
				spellCheck: false,
				style: {...monospaceFont},
			}}
			margin="dense"
			style={{marginBottom: 10}}
			value={sendAmount}
			onChange={(event) => { setSendAmount(event.target.value) }}
		/>}
		<Button
			id={`contract-action-${props.abi.name}`}
			variant="outlined"
			style={{marginBottom: 10}}
			disabled={props.disabled}
			onClick={handleAction}>{props.actionLabel}</Button>
	</Box>)
}
export default ContractCallInputs