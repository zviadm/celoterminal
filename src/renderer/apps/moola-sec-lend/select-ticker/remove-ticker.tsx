import * as React from "react";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
} from "@material-ui/core";
import { moolaSecLendToken } from "../moola-sec-lend-helper";
import { removeTickerFromList } from "./ticker-state";
import { selectAddressOrThrow } from "../../../../lib/cfg";

const RemoveTicker = (props: {
	toRemove: moolaSecLendToken;
	onCancel: () => void;
	onRemove: () => void;
}): JSX.Element => {
	const handleRemove = () => {
		const address = selectAddressOrThrow(props.toRemove.addresses);
		if (address) {
			removeTickerFromList(address);
		}
		props.onRemove();
	};
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Remove Token?</DialogTitle>
			<DialogContent>
				<Typography>
					Removing a token will hide it from all Celo Terminal apps that
					interact with the custom tokens. You can always add this token back at
					any time in the future.
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button
					id="confirm-remove-erc20"
					onClick={handleRemove}
					color="secondary"
				>
					Remove
				</Button>
			</DialogActions>
		</Dialog>
	);
};
export default RemoveTicker;
