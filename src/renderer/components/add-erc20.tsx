import * as React from "react"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@material-ui/core"
import { RegisteredErc20 } from "../../lib/erc20/core"


const AddErc20 = (props: {
	onCancel: () => void,
	onAdd: (erc20: RegisteredErc20) => void,
}): JSX.Element => {
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Add ERC20 Token</DialogTitle>
			<DialogContent>

			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button>Add</Button>
			</DialogActions>
		</Dialog>
	)
}
export default AddErc20