import * as React from "react";
import { Box, Button } from "@material-ui/core";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import { MAX_UINT_256, toBigNumberWei, BN } from "./moola-helper";

const Withdraw = ({
	onWithdraw,
	totalDeposited,
}: {
	onWithdraw: (amount: BigNumber) => void;
	totalDeposited: string;
}): JSX.Element => {
	const [withdrawAmount, setWithdrawAmount] = React.useState("");
	const withdrawAmountForTx = BN(withdrawAmount).isEqualTo(BN(totalDeposited))
		? BN(MAX_UINT_256)
		: toBigNumberWei(withdrawAmount);

	return (
		<Box display="flex" flexDirection="column">
			<NumberInput
				id="withdraw-amount-input"
				label="Amount"
				margin="normal"
				maxValue={new BigNumber(totalDeposited)}
				onChangeValue={setWithdrawAmount}
				placeholder="0.0"
				value={withdrawAmount}
			/>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={withdrawAmount === ""}
					onClick={() => onWithdraw(withdrawAmountForTx)}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Withdraw
				</Button>
			</div>
		</Box>
	);
};
export default Withdraw;
