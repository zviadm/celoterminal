import { AbiItem } from '@celo/connect'

import * as React from 'react'
import {
	Button, Box, TextField,
} from '@material-ui/core'

const ContractCallInputs = (props: {
	abi: AbiItem,
	actionLabel: string,
	disabled?: boolean,
	onAction: (inputs: string[]) => void,
}): JSX.Element => {
	const [inputs, setInputs] = React.useState<{[key: number]: string | undefined}>({})
	const handleAction = () => {
		const inps = props.abi.inputs?.map((inp, idx) => inputs[idx] || "") || []
		props.onAction(inps)
	}

	return (<Box display="flex" flexDirection="column">
		{
			props.abi.inputs?.map((input, idx) => {
				return (
					<TextField
						key={idx}
						id={`input-${input.name}-${idx}`}
						label={`${input.name || "<input>"} (${input.type})`}
						InputLabelProps={{shrink: true}}
						size="medium"
						fullWidth={true}
						spellCheck={false}
						inputProps={{
							spellCheck: false,
							style: {fontFamily: "monospace"}
						}}
						margin="dense"
						style={{marginBottom: 10}}
						value={inputs[idx] || ""}
						onChange={(event) => { setInputs((inputs) => ({...inputs, [idx]: event.target.value})) }}
					/>
				)
			})
		}
		<Button
			variant="outlined"
			style={{marginBottom: 10}}
			disabled={props.disabled}
			onClick={handleAction}>{props.actionLabel}</Button>
	</Box>)
}
export default ContractCallInputs