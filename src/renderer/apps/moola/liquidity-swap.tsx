import * as React from "react";
import {
	Box,
	Select,
	Button,
	InputLabel,
	MenuItem,
	Tooltip,
} from "@material-ui/core";
import { CeloTokenType } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import NumberInput from "../../components/number-input";
import { BN, moolaToken, toBigNumberWei } from "./moola-helper";

const LiquiditySwap = ({
	onLiquiditySwap,
	toTokens,
	tokenMenuItems,
	tokenName,
	maxSwapAmount,
}: {
	onLiquiditySwap: (assetToSymbol: string, amount: BigNumber) => void;
	toTokens: moolaToken[];
	tokenMenuItems: JSX.Element[];
	tokenName: string;
	maxSwapAmount: BigNumber;
}): JSX.Element => {
	const [amount, setAmount] = React.useState("");
	const [toToken, setToToken] = React.useState(toTokens[0].symbol);

	React.useEffect(() => {
		if (!toTokens.find((token) => token.symbol === toToken)) {
			setToToken(toTokens[0].symbol);
		}
	}, [toTokens, toToken]);

	return (
		<Box display="flex" flexDirection="column">
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<Box style={{ width: "45%" }}>
					<InputLabel>Asset From</InputLabel>
					<Tooltip title="Please select from token in the above section">
						<Select disabled style={{ width: "100%" }} value={tokenName}>
							<MenuItem value={tokenName}>{tokenName}</MenuItem>
						</Select>
					</Tooltip>
				</Box>
				<Box style={{ width: "45%" }}>
					<InputLabel>Asset To</InputLabel>
					<Select
						onChange={(event) => {
							setToToken(event.target.value as CeloTokenType);
						}}
						style={{ width: "100%" }}
						value={toToken}
					>
						{tokenMenuItems}
					</Select>
				</Box>
			</div>
			<NumberInput
				id="liquidity-swap-amount"
				label="Amount to swap"
				margin="normal"
				maxValue={BN(maxSwapAmount)}
				onChangeValue={setAmount}
				placeholder="0.0"
				value={amount}
			/>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={amount === ""}
					onClick={() => onLiquiditySwap(toToken, toBigNumberWei(amount))}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Swap
				</Button>
			</div>
		</Box>
	);
};

export default LiquiditySwap;
