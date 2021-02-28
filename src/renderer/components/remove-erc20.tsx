import * as React from "react"
import {
	Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography
} from "@material-ui/core"
import { RegisteredErc20 } from "../../lib/erc20/core"
import { removeErc20FromList } from "../state/erc20list-state"


const RemoveErc20 = (props: {
	toRemove: RegisteredErc20,
	onCancel: () => void,
	onRemove: () => void,
}): JSX.Element => {
	const handleRemove = () => {
		removeErc20FromList(props.toRemove.address)
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
				<Button onClick={handleRemove} color="secondary">Remove</Button>
			</DialogActions>
		</Dialog>
	)
}
export default RemoveErc20