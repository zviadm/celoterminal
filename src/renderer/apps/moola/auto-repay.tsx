import * as React from "react";
import { Box, Button, InputLabel } from "@material-ui/core";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import { toBigNumberWei } from "./moola-helper";

const AutoRepay = (props: {
	onSetAutoRepay: (
		minHealthFactor: BigNumber,
		maxHealthFactor: BigNumber
	) => void;
}): JSX.Element => {
	const [minHealthFactor, setMinHealthFactor] = React.useState("");
	const [maxHealthFactor, setMaxHealthFactor] = React.useState("");

	return (
		<Box display="flex" flexDirection="column">
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<Box style={{ width: "45%" }}>
					<InputLabel>If health factor reaches</InputLabel>
					<NumberInput
						id="min-health-factor"
						margin="normal"
						onChangeValue={setMinHealthFactor}
						placeholder="0.0"
						value={minHealthFactor}
					/>
				</Box>
				<Box style={{ width: "45%" }}>
					<InputLabel>Then repay to health factor</InputLabel>
					<NumberInput
						id="max-health-factor"
						margin="normal"
						onChangeValue={setMaxHealthFactor}
						placeholder="0.0"
						value={maxHealthFactor}
					/>
				</Box>
			</div>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={minHealthFactor === "" || maxHealthFactor === ""}
					onClick={() =>
						props.onSetAutoRepay(
							toBigNumberWei(minHealthFactor),
							toBigNumberWei(maxHealthFactor)
						)
					}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Submit
				</Button>
			</div>
		</Box>
	);
};

export default AutoRepay;
