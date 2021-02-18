import * as React from 'react'
import { TextField, Button, TextFieldProps, InputAdornment } from '@material-ui/core'

type NumberInputProps = TextFieldProps & {
	onMax?: () => void,
}

const NumberInput = (props: NumberInputProps): JSX.Element => {
	const onMax = props.onMax
	const propsCopy = {...props}
	if (onMax) {
		delete propsCopy.onMax
		propsCopy.InputProps = {
			...propsCopy.InputProps,
			endAdornment: (
				<InputAdornment position="end">
					<Button onClick={onMax}>max</Button>
				</InputAdornment>
			),
		}
	}
	return (
		<TextField
			size="medium"
			fullWidth={true}
			inputMode="decimal"
			{...propsCopy}
		/>
	)
}
export default NumberInput