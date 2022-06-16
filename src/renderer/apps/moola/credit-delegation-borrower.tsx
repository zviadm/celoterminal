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
import SectionTitle from "../../components/section-title";
import { availableRateMode } from "./config";
import { toBigNumberWei } from "./moola-helper";

const CreditDelegationBorrowerSection = ({
	handleSubmit,
	sectionTitle,
	submitAction,
	type,
}: {
	handleSubmit: (address: string, rateMode: number, amount: BigNumber) => void;
	sectionTitle: string;
	submitAction: string;
	type: string;
}) => {
	const [address, setAddress] = React.useState("");
	const [rateMode, setRateMode] = React.useState(availableRateMode.stable);
	const [amount, setAmount] = React.useState("");

	return (
		<>
			<SectionTitle>{sectionTitle}</SectionTitle>
			<InputLabel style={{ marginTop: 18 }}>
				Delegator Address to borrow from
			</InputLabel>
			<TextField
				InputLabelProps={{ shrink: true }}
				autoFocus
				fullWidth={true}
				id={`${type}-address`}
				inputProps={{
					spellCheck: false,
					style: { fontFamily: "monospace" },
				}}
				onChange={(event) => {
					setAddress(event.target.value);
				}}
				placeholder="0x..."
				size="medium"
				spellCheck={false}
				value={address}
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
						key={modeName}
						value={
							availableRateMode[modeName as keyof typeof availableRateMode]
						}
					>
						{modeName}
					</MenuItem>
				))}
			</Select>
			<InputLabel style={{ marginTop: 18 }}>Amount</InputLabel>
			<NumberInput
				id={`${type}-input`}
				margin="dense"
				onChangeValue={setAmount}
				placeholder="0.0"
				value={amount}
			/>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={amount === ""}
					onClick={() =>
						handleSubmit(address, rateMode, toBigNumberWei(amount))
					}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					{submitAction}
				</Button>
			</div>
		</>
	);
};

const CreditDelegationBorrower = (props: {
	onBorrowFrom: (
		delegator: string,
		reateMode: number,
		amount: BigNumber
	) => void;
	onRepayFor: (delegator: string, rateMode: number, amount: BigNumber) => void;
}): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<CreditDelegationBorrowerSection
				handleSubmit={props.onBorrowFrom}
				sectionTitle="Borrow From"
				submitAction="Borrow"
				type="borrow-from"
			/>
			<CreditDelegationBorrowerSection
				handleSubmit={props.onRepayFor}
				sectionTitle="Repay For"
				submitAction="Repay"
				type="repay-for"
			/>
		</Box>
	);
};

export default CreditDelegationBorrower;
