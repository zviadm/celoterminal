import * as React from "react";
import BigNumber from "bignumber.js";
import { Box, Select, MenuItem } from "@material-ui/core";
import { CeloTokenType, ContractKit } from "@celo/contractkit";
import {
	AbiItem,
	toTransactionObject,
	CeloTransactionObject,
} from "@celo/connect";
import { Account } from "../../../lib/accounts/accounts";
import { TXFunc, TXFinishFunc } from "../../components/app-definition";
import { newErc20 } from "../../../lib/erc20/erc20-contract";
import { Moola } from "./def";
import { moolaTokens, MOO } from "./config";
import { CFG, selectAddressOrThrow } from "../../../lib/cfg";

import AppHeader from "../../components/app-header";
import AppSection from "../../components/app-section";
import AppContainer from "../../components/app-container";
import SectionTitle from "../../components/section-title";

import Deposit from "./deposit";
import Withdraw from "./withdraw";
import Borrow from "./borrow";
import Repay from "./repay";
import UserReserveStatus from "./user-reserve-status";
import AccountStatus from "./account-status";
import CreditDelegationDelegator from "./credit-delegation-delegator";
import CreditDelegationBorrower from "./credit-delegation-borrower";
import AutoRepay from "./auto-repay";
import RepayFromCollateral from "./repay-from-collateral";
import LiquiditySwap from "./liquidity-swap";
import ReserveStatus from "./reserve-status";

import useLocalStorageState from "../../state/localstorage-state";
import { useUserOnChainState } from "./state";
import useOnChainState from "../../state/onchain-state";

import { abi as LendingPoolABI } from "./abi/LendingPool.json";
import { abi as LendingPoolDataProviderABI } from "./abi/DataProvider.json";
import { abi as AutoRepayABI } from "./abi/AutoRepay.json";
import { abi as MTokenABI } from "./abi/Mtoken.json";
import { abi as DebtTokenABI } from "./abi/DebtToken.json";
import { abi as PriceOracleABI } from "./abi/PriceOracle.json";
import { abi as UbeswapABI } from "./abi/Ubeswap.json";
import { abi as RepayAdapterABI } from "./abi/RepayAdapter.json";

import {
	BN,
	getTokenToSwapPrice,
	ALLOWANCE_THRESHOLD,
	MAX_UINT_256,
	buildLiquiditySwapParams,
	buildSwapAndRepayParams,
	ZERO_HASH,
	MOOLA_AVAILABLE_CHAIN_IDS,
	defaultUserAccountData,
	defaultReserveData,
	defaultUserReserveData,
	moolaToken,
} from "./moola-helper";

const MoolaApp = (props: {
	accounts: Account[];
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void;
	selectedAccount: Account;
}): JSX.Element => {
	const account = props.selectedAccount;
	const actions = [
		"Deposit",
		"Withdraw",
		"Borrow",
		"Repay",
		"Credit Delegation as Delegator",
		"Credit Delegation as Borrower",
		"Auto Repay",
		"Repay from Collateral",
		"Liquidity Swap",
	];

	const [selectedToken, setSelectedToken] = useLocalStorageState(
		"terminal/moola/erc20",
		moolaTokens[0].symbol
	);
	const [selectedAction, setSelectedAction] = useLocalStorageState(
		"terminal/moola/actions",
		actions[0]
	);
	const tokenInfo: moolaToken =
		moolaTokens.find((e) => e.symbol === selectedToken) || MOO;

	const tokenAddress = selectAddressOrThrow(tokenInfo.addresses);
	tokenInfo.address = tokenAddress;

	const accountState = useOnChainState(
		React.useCallback(
			async (kit: ContractKit) => {
				const selectedErc20 = await newErc20(kit, tokenInfo);
				const balance = await selectedErc20.balanceOf(account.address);
				return {
					balance,
				};
			},
			[account, tokenInfo]
		)
	);

	const tokenNames = moolaTokens.map((t) => t.symbol);
	const userOnchainState = useUserOnChainState(account, tokenAddress);

	const isFetching = accountState.isFetching || userOnchainState.isFetching;

	if (!MOOLA_AVAILABLE_CHAIN_IDS.includes(CFG().chainId.toString())) {
		throw new Error(`Moola is not available on chainId: ${CFG().chainId}!`);
	}

	let lendingPoolAddress: string;
	let lendingPoolDataProviderAddress: string;
	if (userOnchainState.fetched) {
		({ lendingPoolAddress, lendingPoolDataProviderAddress } =
			userOnchainState.fetched);
	}

	const handleDeposit = (amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				// approve
				const tokenContract = await newErc20(kit, tokenInfo);
				const txApprove = tokenContract.approve(lendingPoolAddress, amount);

				// deposit
				const LendingPool = new kit.web3.eth.Contract(
					LendingPoolABI as AbiItem[],
					lendingPoolAddress
				);
				const txDeposit = toTransactionObject(
					kit.connection,
					LendingPool.methods.deposit(tokenAddress, amount, account.address, 0)
				);

				return [{ tx: txApprove }, { tx: txDeposit }];
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleWithdraw = (amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				const LendingPool = new kit.web3.eth.Contract(
					LendingPoolABI as AbiItem[],
					lendingPoolAddress
				);
				const tx = toTransactionObject(
					kit.connection,
					LendingPool.methods.withdraw(tokenAddress, amount, account.address)
				);

				return [{ tx }];
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleBorrow = (rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				const LendingPool = new kit.web3.eth.Contract(
					LendingPoolABI as AbiItem[],
					lendingPoolAddress
				);
				const tx = toTransactionObject(
					kit.connection,
					LendingPool.methods.borrow(
						tokenAddress,
						amount,
						rateMode,
						0,
						account.address
					)
				);

				return [{ tx }];
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleRepay = (rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				// approve
				const tokenContract = await newErc20(kit, tokenInfo);
				const txApprove = tokenContract.approve(lendingPoolAddress, amount);

				// repay
				const LendingPool = new kit.web3.eth.Contract(
					LendingPoolABI as AbiItem[],
					lendingPoolAddress
				);
				const txRepay = toTransactionObject(
					kit.connection,
					LendingPool.methods.repay(
						tokenAddress,
						amount,
						rateMode,
						account.address
					)
				);

				return [{ tx: txApprove }, { tx: txRepay }];
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleBorrowFrom = (
		deleagatorAddress: string,
		rateMode: number,
		amount: BigNumber
	) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				const LendingPool = new kit.web3.eth.Contract(
					LendingPoolABI as AbiItem[],
					lendingPoolAddress
				);

				const tx = toTransactionObject(
					kit.connection,
					LendingPool.methods.borrow(
						tokenAddress,
						amount,
						rateMode,
						0,
						deleagatorAddress
					)
				);

				return [{ tx }];
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleRepayFor = (
		repayForAddress: string,
		rateMode: number,
		amount: BigNumber
	) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				const tokenContract = await newErc20(kit, tokenInfo);
				const txApprove = tokenContract.approve(lendingPoolAddress, amount);

				const LendingPool = new kit.web3.eth.Contract(
					LendingPoolABI as AbiItem[],
					lendingPoolAddress
				);
				const txRepay = toTransactionObject(
					kit.connection,
					LendingPool.methods.repay(
						tokenAddress,
						amount,
						rateMode,
						repayForAddress
					)
				);

				return [{ tx: txApprove }, { tx: txRepay }];
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleDelegate = (
		borrowerAddress: string,
		rateMode: number,
		amount: BigNumber
	) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				const LendingPoolDataProvider = new kit.web3.eth.Contract(
					LendingPoolDataProviderABI as AbiItem[],
					lendingPoolDataProviderAddress
				);
				const reserveTokens = await LendingPoolDataProvider.methods
					.getReserveTokensAddresses(tokenAddress)
					.call();
				const key =
					rateMode === 1
						? "stableDebtTokenAddress"
						: "variableDebtTokenAddress";
				const debtTokenContract = new kit.web3.eth.Contract(
					DebtTokenABI as AbiItem[],
					reserveTokens[key]
				);

				const tx = toTransactionObject(
					kit.connection,
					debtTokenContract.methods.approveDelegation(borrowerAddress, amount)
				);

				return [{ tx }];
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleSetAutoRepay = (
		minHealthFactor: BigNumber,
		maxHealthFactor: BigNumber
	) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				const AutoRepay = new kit.web3.eth.Contract(
					AutoRepayABI as AbiItem[],
					userOnchainState.fetched.autoRepayAddress
				);
				const tx = toTransactionObject(
					kit.connection,
					AutoRepay.methods.setMinMaxHealthFactor(
						minHealthFactor,
						maxHealthFactor
					)
				);

				return [{ tx }];
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleRepayFromCollateral = (
		collateralAssetSymbol: string,
		debtAssetSymbol: string,
		rateMode: number,
		amount: BigNumber,
		useFlashLoan: boolean
	) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				const txs = [];
				const collateralAssetInfo: moolaToken | undefined = moolaTokens.find(
					(token) => token.symbol === collateralAssetSymbol
				);

				const debtAssetInfo: moolaToken | undefined = moolaTokens.find(
					(token) => token.symbol === debtAssetSymbol
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
				const useATokenAsFrom = collateralAssetSymbol != "CELO";
				const useATokenAsTo = debtAssetSymbol != "CELO";

				const LendingPoolDataProvider = new kit.web3.eth.Contract(
					LendingPoolDataProviderABI as AbiItem[],
					lendingPoolDataProviderAddress
				);
				const reserveCollateralToken = await LendingPoolDataProvider.methods
					.getReserveTokensAddresses(collateralAssetAddress)
					.call();
				const mToken = new kit.web3.eth.Contract(
					MTokenABI as AbiItem[],
					reserveCollateralToken.aTokenAddress
				);

				const reserveDebtToken = await LendingPoolDataProvider.methods
					.getReserveTokensAddresses(debtAssetAddress)
					.call();

				const Ubeswap = new kit.web3.eth.Contract(
					UbeswapABI as AbiItem[],
					userOnchainState.fetched.ubeswapAddress
				);
				let maxCollateralAmount: string = BN("0").toFixed(0);
				if (collateralAssetSymbol !== debtAssetSymbol) {
					const amountOut = useFlashLoan
						? amount.plus(amount.multipliedBy(9).dividedBy(10000))
						: amount;

					const amounts = await Ubeswap.methods
						.getAmountsIn(amountOut, [
							useATokenAsFrom
								? reserveCollateralToken.aTokenAddress
								: collateralAssetAddress,
							useATokenAsTo ? reserveDebtToken.aTokenAddress : debtAssetAddress,
						])
						.call();
					maxCollateralAmount = BN(amounts[0])
						.plus(BN(amounts[0]).multipliedBy(1).dividedBy(1000))
						.toFixed(0); // 0.1% slippage
				}

				const {
					repayAdapterAddress,
					lendingPoolAddress,
				}: { repayAdapterAddress: string; lendingPoolAddress: string } =
					userOnchainState.fetched;
				if (
					BN(
						await mToken.methods
							.allowance(account.address, repayAdapterAddress)
							.call()
					).lt(BN(maxCollateralAmount))
				) {
					// Approve UniswapAdapter
					const txApproveAdapter = toTransactionObject(
						kit.connection,
						mToken.methods.approve(repayAdapterAddress, maxCollateralAmount)
					);
					txs.push({ tx: txApproveAdapter });
				}

				let txRepay: CeloTransactionObject<unknown>;

				if (useFlashLoan) {
					const callParams = buildSwapAndRepayParams(
						kit.web3,
						collateralAssetAddress,
						maxCollateralAmount,
						rateMode,
						0,
						0,
						0,
						ZERO_HASH,
						ZERO_HASH,
						false,
						useATokenAsFrom,
						useATokenAsTo
					);
					const LendingPool = new kit.web3.eth.Contract(
						LendingPoolABI as AbiItem[],
						lendingPoolAddress
					);
					txRepay = toTransactionObject(
						kit.connection,
						LendingPool.methods.flashLoan(
							repayAdapterAddress,
							[debtAssetAddress],
							[amount],
							[0],
							account.address,
							callParams,
							0
						)
					);
				} else {
					const RepayAdapter = new kit.web3.eth.Contract(
						RepayAdapterABI as AbiItem[],
						repayAdapterAddress
					);
					txRepay = toTransactionObject(
						kit.connection,
						RepayAdapter.methods.swapAndRepay(
							collateralAssetAddress,
							debtAssetAddress,
							maxCollateralAmount,
							amount,
							rateMode,
							{ amount: 0, deadline: 0, v: 0, r: ZERO_HASH, s: ZERO_HASH },
							false,
							useATokenAsFrom,
							useATokenAsTo
						)
					);
				}

				txs.push({ tx: txRepay });

				return txs;
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const handleLiquiditySwap = (assetToSymbol: string, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching || !userOnchainState.fetched) return [];

				const {
					priceOracleAddress,
					liquiditySwapAdapterAddress,
				}: {
					priceOracleAddress: string;
					liquiditySwapAdapterAddress: string;
				} = userOnchainState.fetched;

				const txs = [];
				const assetFromSymbol = selectedToken;
				const assetFromInfo = moolaTokens.find(
					(token) => token.symbol === assetFromSymbol
				);
				const assetToInfo = moolaTokens.find(
					(token) => token.symbol === assetToSymbol
				);
				if (!assetFromInfo || !assetToInfo) {
					throw new Error("Selected tokens are invalid");
				}
				const assetFromAddress = selectAddressOrThrow(assetFromInfo.addresses);
				const assetToAddress = selectAddressOrThrow(assetToInfo.addresses);
				if (!assetFromAddress || !assetToAddress) {
					throw new Error("Asset address is invalid");
				}
				const useAtokenAsFrom = assetFromSymbol != "CELO";
				const useAtokenAsTo = assetToSymbol != "CELO";

				const LendingPoolDataProvider = new kit.web3.eth.Contract(
					LendingPoolDataProviderABI as AbiItem[],
					lendingPoolDataProviderAddress
				);
				const reserveTokens = await LendingPoolDataProvider.methods
					.getReserveTokensAddresses(assetFromAddress)
					.call();
				const mToken = new kit.web3.eth.Contract(
					MTokenABI as AbiItem[],
					reserveTokens.aTokenAddress
				);

				const PriceOracle = new kit.web3.eth.Contract(
					PriceOracleABI as AbiItem[],
					priceOracleAddress
				);
				const [tokenFromPrice, tokenToPrice] = await PriceOracle.methods
					.getAssetsPrices([assetFromAddress, assetToAddress])
					.call();

				const tokenSwapPrice = getTokenToSwapPrice(
					amount,
					tokenFromPrice,
					tokenToPrice
				);
				const currentAllowance = await mToken.methods
					.allowance(account.address, liquiditySwapAdapterAddress)
					.call();

				if (BN(currentAllowance).isLessThan(ALLOWANCE_THRESHOLD)) {
					const approveTx = toTransactionObject(
						kit.connection,
						mToken.methods.approve(liquiditySwapAdapterAddress, MAX_UINT_256)
					);
					txs.push({ tx: approveTx });
				}

				const liquiditySwapParams = buildLiquiditySwapParams(
					kit.web3,
					[assetToAddress],
					[tokenSwapPrice],
					[0],
					[0],
					[0],
					[0],
					[ZERO_HASH],
					[ZERO_HASH],
					[false],
					[useAtokenAsFrom],
					[useAtokenAsTo]
				);

				const LendingPool = new kit.web3.eth.Contract(
					LendingPoolABI as AbiItem[],
					lendingPoolAddress
				);
				const liquiditySwapTx = toTransactionObject(
					kit.connection,
					LendingPool.methods.flashLoan(
						liquiditySwapAdapterAddress,
						[assetFromAddress],
						[amount],
						[0],
						account.address,
						liquiditySwapParams,
						0
					)
				);
				txs.push({ tx: liquiditySwapTx });

				return txs;
			},
			() => {
				userOnchainState.refetch();
			}
		);
	};

	const refetchAll = () => {
		accountState.refetch();
		userOnchainState.refetch();
	};

	const tokenBalance =
		accountState.fetched?.balance.shiftedBy(-tokenInfo.decimals) ||
		new BigNumber("0");
	const tokenMenuItems: JSX.Element[] = tokenNames.map((token) => (
		<MenuItem key={token} value={token}>
			{token}
		</MenuItem>
	));
	const tokenMenuItemsExcludingSelected: JSX.Element[] = tokenNames
		.filter((token) => token !== selectedToken)
		.map((token) => (
			<MenuItem key={token} value={token}>
				{token}
			</MenuItem>
		));
	const moolaTokensExcludingSelected = moolaTokens.filter(
		(mt) => mt.symbol !== selectedToken
	);
	const actionComponents = {
		Deposit: <Deposit onDeposit={handleDeposit} tokenBalance={tokenBalance} />,
		Withdraw: (
			<Withdraw
				onWithdraw={handleWithdraw}
				totalDeposited={
					userOnchainState.fetched?.userReserveData.Deposited || "0"
				}
			/>
		),
		Borrow: <Borrow onBorrow={handleBorrow} />,
		Repay: (
			<Repay
				onRepay={handleRepay}
				stableDebt={
					userOnchainState.fetched?.userReserveData["Current Stable Debt"] ||
					"0"
				}
				tokenBalance={tokenBalance}
				variableDebt={
					userOnchainState.fetched?.userReserveData["Current Variable Debt"] ||
					"0"
				}
			/>
		),
		"Credit Delegation as Borrower": (
			<CreditDelegationBorrower
				onBorrowFrom={handleBorrowFrom}
				onRepayFor={handleRepayFor}
			/>
		),
		"Credit Delegation as Delegator": (
			<CreditDelegationDelegator onDelegate={handleDelegate} />
		),
		"Auto Repay": <AutoRepay onSetAutoRepay={handleSetAutoRepay} />,
		"Repay from Collateral": (
			<RepayFromCollateral
				onRepayFromCollateral={handleRepayFromCollateral}
				tokenMenuItems={tokenMenuItems}
				tokenName={selectedToken}
			/>
		),
		"Liquidity Swap": (
			<LiquiditySwap
				onLiquiditySwap={handleLiquiditySwap}
				toTokens={moolaTokensExcludingSelected}
				tokenMenuItems={tokenMenuItemsExcludingSelected}
				tokenName={selectedToken}
			/>
		),
	};

	return (
		<AppContainer>
			<AppHeader app={Moola} isFetching={isFetching} refetch={refetchAll} />

			<AppSection>
				<AccountStatus
					isFetching={isFetching}
					userAccountData={
						userOnchainState.fetched?.userAccountData || defaultUserAccountData
					}
				/>
			</AppSection>

			<AppSection>
				<Box
					marginTop={1}
					style={{ display: "flex", justifyContent: "space-between" }}
				>
					<Box style={{ width: "45%" }}>
						<SectionTitle>Token</SectionTitle>
						<Select
							onChange={(event) => {
								setSelectedToken(event.target.value as CeloTokenType);
							}}
							style={{ width: "100%" }}
							value={selectedToken}
						>
							{tokenMenuItems}
						</Select>
					</Box>
					<Box style={{ width: "45%" }}>
						<SectionTitle>Action</SectionTitle>
						<Select
							onChange={(event) => {
								setSelectedAction(event.target.value as CeloTokenType);
							}}
							style={{ width: "100%" }}
							value={selectedAction}
						>
							{actions.map((action) => (
								<MenuItem key={action} value={action}>
									{action}
								</MenuItem>
							))}
						</Select>
					</Box>
				</Box>
			</AppSection>

			<AppSection>
				{actionComponents[selectedAction as keyof typeof actionComponents]}
			</AppSection>

			<AppSection>
				<ReserveStatus
					isFetching={isFetching}
					reserveData={
						userOnchainState.fetched?.reserveData || defaultReserveData
					}
					tokenName={selectedToken}
				/>
			</AppSection>
			<AppSection>
				<UserReserveStatus
					isFetching={isFetching}
					tokenName={selectedToken}
					userReserveData={
						userOnchainState.fetched?.userReserveData || defaultUserReserveData
					}
				/>
			</AppSection>
		</AppContainer>
	);
};
export default MoolaApp;
