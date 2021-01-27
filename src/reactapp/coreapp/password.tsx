import * as React from 'react'

import Dialog from '@material-ui/core/Dialog'

const Password = (props: {
	onPassword: (p: string) => void,
	onCancel: () => void,
}): JSX.Element => {

	return (
		<Dialog open={true} onClose={() => { props.onCancel() }}>
			{/* <DialogTitle>Enter Address</DialogTitle>
			<DialogContent>
				<TextField
						autoFocus
						margin="dense"
						label={`Name`}
						variant="outlined"
						value={name}
						size="medium"
						fullWidth={true}
						onChange={(e) => { setName(e.target.value) }}
					/>
				<TextField
						margin="dense"
						label={`Address`}
						variant="outlined"
						value={address}
						size="medium"
						fullWidth={true}
						inputProps={{style: {fontSize: 14}}}
						onChange={(e) => { setAddress(e.target.value) }}
					/>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => { props.onAdd() }}>Cancel</Button>
				<Button onClick={() => { props.onAdd({
					type: "address-only",
					name: name,
					address: address,
					})}}
					disabled={!canAdd}>Add</Button>
			</DialogActions> */}
		</Dialog>
	)
}
export default Password