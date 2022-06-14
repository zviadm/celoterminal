import * as React from "react";
import {
	Box,
	Select,
	Button,
	MenuItem,
	TextField,
	InputLabel,
} from "@material-ui/core";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import { availableRateMode } from "./config";
import { toBigNumberWei } from "./moola-helper";

const CreditDelegationDeleagtor = (props: {
	onDelegate: (
		borrowerAddress: string,
		rateMode: number,
		amount: BigNumber
	) => void;
}): JSX.Element => {
	const [borrowerAddress, setBorrowerAddress] = React.useState("");
	const [rateMode, setRateMode] = React.useState(availableRateMode.stable);
	const [delegateAmount, setDelegateAmount] = React.useState("");

	return (
		<Box display="flex" flexDirection="column">
			<InputLabel>Borrower address to delegate to</InputLabel>
			<TextField
				InputLabelProps={{ shrink: true }}
				autoFocus
				fullWidth={true}
				id="delegation-borrower-address"
				inputProps={{
					spellCheck: false,
					style: { fontFamily: "monospace" },
				}}
				onChange={(event) => {
					setBorrowerAddress(event.target.value);
				}}
				placeholder="0x..."
				size="medium"
				spellCheck={false}
				value={borrowerAddress}
			/>
			<InputLabel style={{ marginTop: 18 }}>Rate type</InputLabel>
			<Select
				onChange={(event) => {
					setRateMode(event.target.value as number);
				}}
				style={{ width: "100%" }}
				value={rateMode}
			>
				{Object.keys(availableRateMode).map((modeName: string) => (
					<MenuItem
						value={
							availableRateMode[modeName as keyof typeof availableRateMode]
						}
						key={modeName}
					>
						{modeName}
					</MenuItem>
				))}
			</Select>
			<InputLabel style={{ marginTop: 18 }}>Amount</InputLabel>
			<NumberInput
				id="delegation-amount-input"
				margin="dense"
				onChangeValue={setDelegateAmount}
				placeholder="0.0"
				value={delegateAmount}
			/>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={delegateAmount === ""}
					onClick={() =>
						props.onDelegate(
							borrowerAddress,
							rateMode,
							toBigNumberWei(delegateAmount)
						)
					}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Delegate
				</Button>
			</div>
		</Box>
	);
};

export default CreditDelegationDeleagtor;
