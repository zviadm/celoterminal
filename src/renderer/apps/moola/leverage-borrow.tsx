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
import { moolaToken, toBigNumberWei } from "./moola-helper";
import { availableRateMode } from "./config";

const LeverageBorrow = ({
	onLeverageBorrow,
	collateralTokenList,
	tokenMenuItems,
	tokenName,
}: {
	onLeverageBorrow: (
		collateralAssetSymbol: string,
		debtAssetSymbol: string,
		rateMode: number,
		amount: BigNumber
	) => void;
	collateralTokenList: moolaToken[];
	tokenMenuItems: JSX.Element[];
	tokenName: string;
}): JSX.Element => {
	const [amount, setAmount] = React.useState("");
	const [rateMode, setRateMode] = React.useState(availableRateMode.stable);
	const [collateralToken, setCollateralToken] = React.useState(
		collateralTokenList[0].symbol
	);

	React.useEffect(() => {
		if (
			!collateralTokenList.find((token) => token.symbol === collateralToken)
		) {
			setCollateralToken(collateralTokenList[0].symbol);
		}
	}, [collateralTokenList, collateralToken]);

	return (
		<Box display="flex" flexDirection="column">
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<Box style={{ width: "45%" }}>
					<InputLabel>Collateral Asset</InputLabel>
					<Select
						onChange={(event) => {
							setCollateralToken(event.target.value as CeloTokenType);
						}}
						style={{ width: "100%" }}
						value={collateralToken}
					>
						{tokenMenuItems}
					</Select>
				</Box>
				<Box style={{ width: "45%" }}>
					<InputLabel>Debt Asset</InputLabel>
					<Tooltip title="Please select from token in the above section">
						<Select disabled style={{ width: "100%" }} value={tokenName}>
							<MenuItem value={tokenName}>{tokenName}</MenuItem>
						</Select>
					</Tooltip>
				</Box>
			</div>
			<NumberInput
				id="leverage-borrow-amount"
				label="Borrow Amount"
				margin="normal"
				onChangeValue={setAmount}
				placeholder="0.0"
				value={amount}
			/>
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
			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={amount === ""}
					onClick={() =>
						onLeverageBorrow(
							collateralToken,
							tokenName,
							rateMode,
							toBigNumberWei(amount)
						)
					}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Leverage Borrow
				</Button>
			</div>
		</Box>
	);
};

export default LeverageBorrow;
