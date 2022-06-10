import * as React from "react";
import { Box, Button, Select, MenuItem, InputLabel } from "@material-ui/core";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import { availableRateMode } from "./config";
import { toBigNumberWei } from "./moola-helper";

const Borrow = (props: {
	onBorrow: (rateMode: number, amount: BigNumber) => void;
}): JSX.Element => {
	const [borrowAmount, setwitBorrowAmount] = React.useState("");
	const [rateMode, setRateMode] = React.useState(availableRateMode.stable);

	return (
		<Box display="flex" flexDirection="column">
			<InputLabel>Rate type</InputLabel>
			<Select
				onChange={(event) => {
					setRateMode(event.target.value as number);
				}}
				style={{ width: "100%" }}
				value={rateMode}
			>
				{Object.keys(availableRateMode).map((modeName: string) => (
					<MenuItem
						key={modeName}
						value={
							availableRateMode[modeName as keyof typeof availableRateMode]
						}
					>
						{modeName}
					</MenuItem>
				))}
			</Select>
			<InputLabel style={{ marginTop: 18 }}>Amount to borrow</InputLabel>
			<NumberInput
				id="sell-amount-input"
				margin="dense"
				onChangeValue={setwitBorrowAmount}
				placeholder="0.0"
				value={borrowAmount}
			/>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={borrowAmount === ""}
					onClick={() => props.onBorrow(rateMode, toBigNumberWei(borrowAmount))}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Borrow
				</Button>
			</div>
		</Box>
	);
};
export default Borrow;
