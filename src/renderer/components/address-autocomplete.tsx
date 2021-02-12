import * as React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Autocomplete from '@material-ui/lab/Autocomplete'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'

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
	label: string,
	address: string,
	onChange: (address: string) => void,
}): JSX.Element => {
	const classes = useStyles()
	const renderOption = (o: Address) => (
		<React.Fragment>
			<Typography className={classes.address}>{o.name ? `${o.name}: `: ``}{o.address}</Typography>
		</React.Fragment>
	)
	return (
		<Autocomplete
			id={props.id}
			freeSolo
			autoSelect
			options={props.addresses}
			renderOption={renderOption}
			getOptionLabel={(o) => o?.address || "" }
			getOptionSelected={(o, v) => { return o.address === v.address }}
			renderInput={(params) => (
				<TextField
					{...params}
					margin="normal"
					label={props.label}
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
			inputValue={props.address}
			onInputChange={(e, value, reason) => {
				if (reason !== "reset" || value !== "") {
					props.onChange(value)
				}
				return value
			}}
		/>
	)
}
export default AddressAutocomplete
