import * as React from 'react'
import { TextField, Button, TextFieldProps, InputAdornment } from '@material-ui/core'

type NumberInputProps = TextFieldProps & {
	onMax?: () => void,
	onChangeValue?: (v: string) => void,
}

const stripRegex = /[^0-9.]+/

const NumberInput = (props: NumberInputProps): JSX.Element => {
	const onMax = props.onMax
	const propsCopy = {...props}
	delete propsCopy.onChangeValue
	if (onMax) {
		delete propsCopy.onMax
		propsCopy.InputProps = {
			...propsCopy.InputProps,
			endAdornment: (
				<InputAdornment position="end">
					<Button
						id={props.id ? props.id + "-set-max" : undefined}
						onClick={onMax}>max</Button>
				</InputAdornment>
			),
		}
	}
	const onChangeValue = props.onChangeValue
	return (
		<TextField
			size="medium"
			fullWidth={true}
			inputMode="decimal"
			{...propsCopy}
			onChange = {onChangeValue && (
				(e) => {
					const v = e.target.value.replace(stripRegex, '')
					onChangeValue(v)
				}
			)}
		/>
	)
}
export default NumberInput