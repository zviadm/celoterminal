import * as React from "react";
import {
	Box,
	Select,
	Button,
	MenuItem,
	InputLabel,
	Tooltip,
} from "@material-ui/core";
import { CeloTokenType } from "@celo/contractkit";
import { availableRateMode, moolaTokens } from "./config";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import { toBigNumberWei, BN } from "./moola-helper";

const RepayFromCollateral = ({
	tokenName,
	onRepayFromCollateral,
	tokenMenuItems,
	stableDebt,
	variableDebt,
	tokenBalance,
}: {
	tokenName: string;
	onRepayFromCollateral: (
		collateralAssetSymbol: string,
		debtAssetSymbol: string,
		rateMode: number,
		amount: BigNumber,
		useFlashLoan: boolean
	) => void;
	tokenMenuItems: JSX.Element[];
	stableDebt: string;
	variableDebt: string;
	tokenBalance: BigNumber;
}): JSX.Element => {
	const [amount, setAmount] = React.useState("");
	const [rateMode, setRateMode] = React.useState(availableRateMode.stable);
	const [collateralAsset, setCollateralAsset] = React.useState(
		moolaTokens[0].symbol
	);
	const [useFlashLoan, toggleUseFlashLoan] = React.useState("NO");

	const hanldeSubmit = () => {
		const useFlashLoanBool = useFlashLoan === "YES";
		onRepayFromCollateral(
			collateralAsset,
			tokenName,
			rateMode,
			toBigNumberWei(amount),
			useFlashLoanBool
		);
	};

	return (
		<Box>
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<Box style={{ width: "45%" }}>
					<InputLabel>Collateral Asset</InputLabel>
					<Select
						onChange={(event) => {
							setCollateralAsset(event.target.value as CeloTokenType);
						}}
						style={{ width: "100%" }}
						value={collateralAsset}
					>
						{tokenMenuItems}
					</Select>
				</Box>
				<Box style={{ width: "45%" }}>
					<InputLabel>Debt Asset</InputLabel>
					<Tooltip title="Please change debt asset in the above section">
						<Select disabled style={{ width: "100%" }} value={tokenName}>
							<MenuItem value={tokenName}>{tokenName}</MenuItem>
						</Select>
					</Tooltip>
				</Box>
			</div>
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
			<InputLabel style={{ marginTop: 18 }}>Amount to repay</InputLabel>
			<NumberInput
				id="repay-from-collateral-amount"
				margin="dense"
				onChangeValue={setAmount}
				placeholder="0.0"
				value={amount}
			/>
			<InputLabel style={{ marginTop: 18 }}>Use flashloan</InputLabel>
			<Select
				onChange={(event) => {
					toggleUseFlashLoan(event.target.value as string);
				}}
				style={{ width: "100%" }}
				value={useFlashLoan}
			>
				<MenuItem key="use-flash-loan-false" value={"NO"}>
					NO
				</MenuItem>
				<MenuItem key="use-flash-loan-true" value={"YES"}>
					YES
				</MenuItem>
			</Select>

			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					disabled={amount === ""}
					onClick={hanldeSubmit}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Repay
				</Button>
			</div>
		</Box>
	);
};

export default RepayFromCollateral;
