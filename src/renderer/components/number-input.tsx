import BigNumber from 'bignumber.js'

import * as React from 'react'
import { TextField, Button, TextFieldProps, InputAdornment } from '@material-ui/core'

type NumberInputProps = TextFieldProps & {
	maxValue?: BigNumber,
	onChangeValue?: (v: string) => void,
}

const stripRegex = /[^0-9.]+/

const NumberInput = (props: NumberInputProps): JSX.Element => {
	const maxValue = props.maxValue
	const onChangeValue = props.onChangeValue
	const propsCopy = {...props}
	delete propsCopy.onChangeValue
	delete propsCopy.maxValue
	if (maxValue && onChangeValue) {
		const handleOnMax = () => { onChangeValue(maxValue.toFixed()) }
		propsCopy.InputProps = {
			...propsCopy.InputProps,
			endAdornment: (
				<InputAdornment position="end">
					<Button
						id={props.id ? props.id + "-set-max" : undefined}
						onClick={handleOnMax}>max</Button>
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