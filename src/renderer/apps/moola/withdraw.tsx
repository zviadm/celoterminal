import * as React from "react";
import { Box, Button } from "@material-ui/core";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import { toBigNumberWei } from "./moola-helper";

const Withdraw = ({
	onWithdraw,
	totalDeposited,
}: {
	onWithdraw: (amount: BigNumber, withdrawAll: boolean) => void;
	totalDeposited: string;
}): JSX.Element => {
	const [withdrawAmount, setWithdrawAmount] = React.useState("");

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
					onClick={() =>
						onWithdraw(
							toBigNumberWei(withdrawAmount),
							withdrawAmount === totalDeposited
						)
					}
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
