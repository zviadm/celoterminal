import * as React from "react";
import { Box, Button, Select, MenuItem, InputLabel } from "@material-ui/core";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import { availableRateMode } from "./config";
import { toBigNumberWei, BN } from "./moola-helper";

const Repay = ({
	onRepay,
	stableDebt,
	tokenBalance,
	variableDebt,
}: {
	onRepay: (rateMode: number, amount: BigNumber) => void;
	stableDebt: string;
	tokenBalance: BigNumber;
	variableDebt: string;
}): JSX.Element => {
	const [rateMode, setRateMode] = React.useState(availableRateMode.stable);
	const [repayAmount, setRepayAmount] = React.useState("");

	const totalDebt =
		rateMode === 1 ? new BigNumber(stableDebt) : new BigNumber(variableDebt);
	const maxRepayAmount = BN(totalDebt).isEqualTo(BN("0"))
		? BN("0")
		: BN(tokenBalance);

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
			<InputLabel style={{ marginTop: 18 }}>Amount to repay</InputLabel>
			<NumberInput
				id="repay-amount-input"
				margin="dense"
				maxValue={maxRepayAmount}
				onChangeValue={setRepayAmount}
				placeholder="0.0"
				value={repayAmount}
			/>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={repayAmount === ""}
					onClick={() => onRepay(rateMode, toBigNumberWei(repayAmount))}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Repay
				</Button>
			</div>
		</Box>
	);
};
export default Repay;
