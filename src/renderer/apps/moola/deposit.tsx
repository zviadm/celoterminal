import * as React from "react";
import { Box, Button } from "@material-ui/core";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import { toBigNumberWei } from "./moola-helper";

const Deposit = ({
	onDeposit,
	tokenBalance,
}: {
	onDeposit: (amount: BigNumber) => void;
	tokenBalance: BigNumber;
}): JSX.Element => {
	const [depositAmount, setDepositAmount] = React.useState("");

	const buttonDisalbed = depositAmount === "";

	return (
		<Box display="flex" flexDirection="column">
			<NumberInput
				id="deposit-amount-input"
				label="Amount"
				margin="normal"
				maxValue={tokenBalance}
				onChangeValue={setDepositAmount}
				placeholder="0.0"
				value={depositAmount}
			/>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={buttonDisalbed}
					onClick={() => onDeposit(toBigNumberWei(depositAmount))}
					id="confirm-deposit"
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Deposit
				</Button>
			</div>
		</Box>
	);
};

export default Deposit;
