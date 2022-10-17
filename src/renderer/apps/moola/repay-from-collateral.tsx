import * as React from "react";
import {
	Box,
	Select,
	Button,
	MenuItem,
	InputLabel,
	Tooltip,
} from "@material-ui/core";
import { CeloTokenType, ContractKit } from "@celo/contractkit";
import { availableRateMode, moolaTokens } from "./config";
import { AbiItem } from "@celo/connect";
import NumberInput from "../../components/number-input";
import BigNumber from "bignumber.js";
import useOnChainState from "../../state/onchain-state";
import {
	BN,
	toBigNumberWei,
	getMoolaSwapPath,
	moolaToken,
	toHumanFriendlyWei,
} from "./moola-helper";
import { abi as UbeswapABI } from "./abi/Ubeswap.json";
import { abi as LendingPoolDataProviderABI } from "./abi/DataProvider.json";
import { selectAddressOrThrow } from "../../../lib/cfg";

const RepayFromCollateral = ({
	tokenName,
	onRepayFromCollateral,
	tokenMenuItems,
	ubeswapAddress,
	lendingPoolDataProviderAddress,
	userAddress,
	stableDebt,
	variableDebt,
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
	ubeswapAddress: string;
	lendingPoolDataProviderAddress: string;
	userAddress: string;
	stableDebt: string;
	variableDebt: string;
}): JSX.Element => {
	const [amount, setAmount] = React.useState("");
	const [rateMode, setRateMode] = React.useState(availableRateMode.stable);
	const [collateralAsset, setCollateralAsset] = React.useState(
		moolaTokens[0].symbol
	);
	const [useFlashLoan, toggleUseFlashLoan] = React.useState("NO");
	const totalDebt = rateMode === 1 ? BN(stableDebt) : BN(variableDebt);
	const noDebt = BN(totalDebt).isEqualTo(BN(0));

	const handleSubmit = () => {
		const useFlashLoanBool = useFlashLoan === "YES";
		onRepayFromCollateral(
			collateralAsset,
			tokenName,
			rateMode,
			toBigNumberWei(amount),
			useFlashLoanBool
		);
	};

	const { fetched: collateralInDebt } = useOnChainState(
		React.useCallback(
			async (kit: ContractKit) => {
				if (!ubeswapAddress || noDebt) return;

				const collateralAssetInfo: moolaToken | undefined = moolaTokens.find(
					(token) => token.symbol === collateralAsset
				);

				const debtAssetInfo: moolaToken | undefined = moolaTokens.find(
					(token) => token.symbol === tokenName
				);
				if (!collateralAssetInfo || !debtAssetInfo) {
					throw new Error("Cannot find selected collateral asset");
				}

				const collateralAssetAddress = selectAddressOrThrow(
					collateralAssetInfo.addresses
				);
				const debtAssetAddress = selectAddressOrThrow(debtAssetInfo.addresses);

				if (!collateralAssetAddress || !debtAssetAddress) {
					throw new Error("Collateral asset or debt asset address is invalid");
				}

				const LendingPoolDataProvider = new kit.web3.eth.Contract(
					LendingPoolDataProviderABI as AbiItem[],
					lendingPoolDataProviderAddress
				);

				const userReserveDataRaw = await LendingPoolDataProvider.methods
					.getUserReserveData(collateralAssetAddress, userAddress)
					.call();

				const totalCollateral = userReserveDataRaw.currentATokenBalance;

				if (BN(totalCollateral).isEqualTo(BN(0))) return;

				const Ubeswap = new kit.web3.eth.Contract(
					UbeswapABI as AbiItem[],
					ubeswapAddress
				);

				const swapPath = getMoolaSwapPath(
					collateralAssetAddress,
					debtAssetAddress
				);

				const amounstOut = await Ubeswap.methods
					.getAmountsOut(totalCollateral, swapPath.path)
					.call(); // check how much debt asset can be repaid with current total collateral amount

				return {
					amount: toHumanFriendlyWei(BN(amounstOut[amounstOut.length - 1])),
				};
			},
			[
				userAddress,
				ubeswapAddress,
				collateralAsset,
				tokenName,
				lendingPoolDataProviderAddress,
				noDebt,
			]
		)
	);

	let maxRepayAmount = BN(0);
	if (!noDebt && collateralInDebt?.amount) {
		maxRepayAmount = BigNumber.minimum(collateralInDebt.amount, totalDebt);
	}

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
				maxValue={maxRepayAmount}
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
					onClick={handleSubmit}
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
