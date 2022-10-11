import { moolaSecLendTickers } from "../config";
import { moolaSecLendTicker } from "../moola-sec-lend-helper";
import { addTickerToList } from "./ticker-state";

import * as React from "react";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Box,
	ListItemText,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";

const addTicker = (props: {
	onCancel: () => void;
	onAdd: (ticker: moolaSecLendTicker) => void;
}): JSX.Element => {
	const [tickerSymbol, setTickerSymbol] = React.useState("");
	const matchingTicker = moolaSecLendTickers.find(
		(f) => f.symbol === tickerSymbol
	);

	const handleAdd = () => {
		let added;

		if (!matchingTicker) {
			return;
		}
		added = addTickerToList(matchingTicker.symbol);

		return props.onAdd(added);
	};
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Add Token</DialogTitle>
			<DialogContent>
				<Box minWidth={500}>
					<Autocomplete
						id="registered-erc20"
						autoHighlight
						options={moolaSecLendTickers}
						renderOption={(o) => (
							<ListItemText primary={o.symbol} secondary={o.name} />
						)}
						getOptionLabel={(o) => `${o.name} (${o.symbol})`}
						getOptionSelected={(o, v) => {
							return o.address === v.address;
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								autoFocus
								label="Token"
								fullWidth={true}
								InputLabelProps={{ shrink: true }}
							/>
						)}
						onChange={(e, value) => {
							setTickerSymbol(value?.symbol || "");
						}}
					/>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button
					id="confirm-add-erc20"
					disabled={!matchingTicker}
					onClick={handleAdd}
				>
					Add
				</Button>
			</DialogActions>
		</Dialog>
	);
};
export default addTicker;
