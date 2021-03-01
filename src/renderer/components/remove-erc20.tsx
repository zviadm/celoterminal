import * as React from "react"
import {
	Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography
} from "@material-ui/core"
import { RegisteredErc20 } from "../../lib/erc20/core"
import { removeErc20FromList } from "../state/erc20list-state"

// RemoveErc20 token can be used to get user confirmation for removing
// given ERC20 token from watched list. RemoveErc20 manages the interaciton
// with the local storage state.
const RemoveErc20 = (props: {
	toRemove: RegisteredErc20,
	onCancel: () => void,
	onRemove: () => void,
}): JSX.Element => {
	const handleRemove = () => {
		if (props.toRemove.address) {
			removeErc20FromList(props.toRemove.address)
		}
		props.onRemove()
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Remove Token?</DialogTitle>
			<DialogContent>
				<Typography>
					Removing a token will hide it from all Celo Terminal apps that interact with the
					custom tokens. You can always add this token back at any time in the future.
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button
					id="confirm-remove-erc20"
					onClick={handleRemove}
					color="secondary">Remove</Button>
			</DialogActions>
		</Dialog>
	)
}
export default RemoveErc20