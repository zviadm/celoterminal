import * as React from "react";
import {
	Select,
	MenuItem,
	Typography,
	Box,
	IconButton,
	ListItemText,
	ListItemSecondaryAction,
} from "@material-ui/core";
import Close from "@material-ui/icons/Close";
import Search from "@material-ui/icons/Search";

import { moolaSecLendTicker } from "../moola-sec-lend-helper";

import RemoveTicker from "./remove-ticker";
import AddTicker from "./add-ticker";
import { DEFAULT_TOKEN } from "../config";

const SelectErc20 = (props: {
	tickers: moolaSecLendTicker[];
	selected: string;
	onSelect: (ticker: moolaSecLendTicker) => void;
	onAddTickers: (ticker: moolaSecLendTicker) => void;
	onRemoveTickers: (ticker: moolaSecLendTicker) => void;
	displayFullName?: boolean;
}): JSX.Element => {
	const [showAddToken, setShowAddToken] = React.useState(false);
	const [toRemove, setToRemove] = React.useState<
		moolaSecLendTicker | undefined
	>();

	return (
		<>
			{showAddToken && (
				<AddTicker
					onCancel={() => {
						setShowAddToken(false);
					}}
					onAdd={(ticker) => {
						setShowAddToken(false);
						props.onAddTickers(ticker);
					}}
				/>
			)}
			{toRemove && (
				<RemoveTicker
					toRemove={toRemove}
					onCancel={() => {
						setToRemove(undefined);
					}}
					onRemove={() => {
						props.onRemoveTickers(toRemove);
						setToRemove(undefined);
					}}
				/>
			)}
			<Select
				id="ticker-select"
				style={{ width: "100%" }}
				autoFocus
				value={props.selected}
				onChange={(event) => {
					if (event.target.value === "add-token") {
						setShowAddToken(true);
					} else {
						const selected = props.tickers.find(
							(e) => e.symbol === event.target.value
						);
						if (selected) {
							props.onSelect(selected);
						}
					}
				}}
			>
				{props.tickers.map((ticker) => {
					return (
						<MenuItem
							key={ticker.symbol}
							id={`ticker-${ticker.symbol}-item`}
							value={ticker.symbol}
						>
							<ListItemText
								primary={ticker.symbol}
								secondary={props.displayFullName ? ticker.name : undefined}
							/>

							<ListItemSecondaryAction>
								{ticker.symbol !== DEFAULT_TOKEN.symbol && (
									<IconButton
										id={`remove-token-${ticker.symbol}`}
										size="small"
										onClick={(event) => {
											setToRemove(ticker);
											event.stopPropagation();
										}}
									>
										<Close />
									</IconButton>
								)}
							</ListItemSecondaryAction>
						</MenuItem>
					);
				})}
				<MenuItem id="add-token" value="add-token">
					<Box display="flex" flexDirection="row" alignItems="center">
						<Typography style={{ fontStyle: "italic" }} color="textSecondary">
							Search...
						</Typography>
						<Search style={{ marginLeft: 5 }} />
					</Box>
				</MenuItem>
			</Select>
		</>
	);
};
export default SelectErc20;
