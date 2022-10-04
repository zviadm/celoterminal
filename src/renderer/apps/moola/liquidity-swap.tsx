import * as React from "react";
import {
	Box,
	Select,
	Button,
	InputLabel,
	MenuItem,
	Tooltip,
	Typography,
} from "@material-ui/core";
import HelpOutline from "@material-ui/icons/HelpOutline";
import { CeloTokenType } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import NumberInput from "../../components/number-input";
import {
	BN,
	moolaToken,
	toBigNumberWei,
	MOOLA_SLIPPAGE_OPTIONS,
} from "./moola-helper";

const LiquiditySwap = ({
	onLiquiditySwap,
	toTokens,
	tokenMenuItems,
	tokenName,
	maxSwapAmount,
}: {
	onLiquiditySwap: (
		assetToSymbol: string,
		amount: BigNumber,
		slippage: string
	) => void;
	toTokens: moolaToken[];
	tokenMenuItems: JSX.Element[];
	tokenName: string;
	maxSwapAmount: string;
}): JSX.Element => {
	const [amount, setAmount] = React.useState("");
	const [toToken, setToToken] = React.useState(toTokens[0].symbol);

	const [slippagePct, setSlippagePct] = React.useState(
		MOOLA_SLIPPAGE_OPTIONS[2]
	);

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
			<Box display="flex" flexDirection="column" style={{ marginTop: 10 }}>
				<Typography variant="caption">
					Max slippage
					<Tooltip title="Your transaction will revert if the price changes unfavourably by more than this percentage.">
						<HelpOutline style={{ fontSize: 12 }} />
					</Tooltip>
				</Typography>
				<Box display="flex" flexDirection="row">
					{MOOLA_SLIPPAGE_OPTIONS.map((o) => (
						<Button
							key={`slippage-${o}`}
							variant={o === slippagePct ? "outlined" : "text"}
							onClick={() => {
								setSlippagePct(o);
							}}
						>
							{o}%
						</Button>
					))}
				</Box>
			</Box>
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={amount === ""}
					onClick={() =>
						onLiquiditySwap(toToken, toBigNumberWei(amount), slippagePct)
					}
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
