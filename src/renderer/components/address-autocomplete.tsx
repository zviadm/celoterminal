import * as React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Autocomplete from '@material-ui/lab/Autocomplete'
import Typography from '@material-ui/core/Typography'
import TextField, { TextFieldProps } from '@material-ui/core/TextField'

const useStyles = makeStyles(() => ({
	address: {
		fontFamily: "monospace",
	}
}))

interface Address {
	name?: string
	address: string
}

const AddressAutocomplete = (props: {
	id?: string,
	addresses: Address[],
	address: string,
	onChange: (address: string) => void,
	textFieldProps?: TextFieldProps,
	noFreeSolo?: boolean,
}): JSX.Element => {
	const classes = useStyles()
	const renderOption = (o: Address) => (
		<React.Fragment>
			<Typography className={classes.address}>{o.name ? `${o.name}: `: ``}{o.address}</Typography>
		</React.Fragment>
	)
	const changeValueProps = !props.noFreeSolo ? {
		freeSolo: true,
		autoSelect: true,
		autoHighlight: true,
		inputValue: props.address,
		onInputChange: (e: unknown, value: string, reason: string) => {
			if (reason !== "reset" || value !== "") {
				props.onChange(value)
			}
			return value
		},
	} : {
		freeSolo: false,
		autoSelect: true,
		autoHighlight: true,
		defaultValue: props.addresses.find((a) => a.address === props.address),
		onChange: (e: unknown, value: string | Address | null) => {
			if (value && typeof value !== "string") {
				props.onChange(value.address)
			}
		},
	}
	return (
		<Autocomplete
			id={props.id}
			options={props.addresses}
			renderOption={renderOption}
			getOptionLabel={(o) => o?.address || "" }
			getOptionSelected={(o, v) => { return o.address === v.address }}
			renderInput={(params) => (
				<TextField
					{...params}
					{...props.textFieldProps}
					placeholder="0x..."
					size="medium"
					fullWidth={true}
					spellCheck={false}
					inputProps={{
						...params.inputProps,
						className: classes.address,
					}}
				/>
			)}
			{...changeValueProps}
		/>
	)
}
export default AddressAutocomplete
