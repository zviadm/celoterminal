import { isValidAddress } from "ethereumjs-util";
import { ensureLeading0x, toChecksumAddress } from "@celo/utils/lib/address";

import { moolaSecLendTokens } from "../config";
import { moolaSecLendToken } from "../moola-sec-lend-helper";
// import { addCustomErc20, addRegisteredErc20 } from "../state/erc20list-state";
import { addTickerToList } from "./ticker-state";

import * as React from "react";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	LinearProgress,
	Tab,
	Table,
	TableBody,
	TextField,
	TableRow,
	TableCell,
	Paper,
	TableContainer,
	Box,
	ListItemText,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";

const addTicker = (props: {
	onCancel: () => void;
	onAdd: (ticker: moolaSecLendToken) => void;
}): JSX.Element => {
	const [tickerSymbol, setTickerSymbol] = React.useState("");
	const matchingTicker = moolaSecLendTokens.find(
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
						options={moolaSecLendTokens}
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
