import * as React from "react";
import BigNumber from "bignumber.js";
import { Box, Select, MenuItem } from "@material-ui/core";
import { CeloTokenType, ContractKit } from "@celo/contractkit";
import { AbiItem, toTransactionObject } from "@celo/connect";
import { Account } from "../../../lib/accounts/accounts";
import { TXFunc, TXFinishFunc } from "../../components/app-definition";
import { newErc20 } from "../../../lib/erc20/erc20-contract";
import { MoolaSecLend } from "./def";
import { moolaSecLendTokens } from "./config";
import { CFG, selectAddressOrThrow } from "../../../lib/cfg";

import AppHeader from "../../components/app-header";
import AppSection from "../../components/app-section";
import AppContainer from "../../components/app-container";
import SectionTitle from "../../components/section-title";

import Deposit from "../moola/deposit";
import Withdraw from "../moola/withdraw";
import Borrow from "../moola/borrow";
import Repay from "../moola/repay";
import ReserveStatus from "../moola/reserve-status";
import UserReserveStatus from "../moola/user-reserve-status";
import AccountStatus from "../moola/account-status";
import SelectTicker from "./select-ticker";

import useLocalStorageState from "../../state/localstorage-state";
import { useUserOnChainState } from "./state";
import useOnChainState from "../../state/onchain-state";

import { abi as LendingPoolABI } from "./abi/LendingPool.json";

import {
	BN,
	MAX_UINT_256,
	defaultUserAccountData,
	defaultReserveData,
	defaultUserReserveData,
} from "../moola/moola-helper";
import { useTickerList, setUpDefaultList } from "./select-ticker/ticker-state";

import {
	MOOLA_SEC_LEND_AVAILABLE_CHAIN_IDS,
	moolaSecLendToken,
} from "./moola-sec-lend-helper";

import { DEFAULT_TOKEN, DEFAULT_TICKER_SYMBOL_LIST } from "./config";

const MoolaSecLendApp = (props: {
	accounts: Account[];
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void;
	selectedAccount: Account;
}): JSX.Element => {
	const account = props.selectedAccount;
	const actions = ["Deposit", "Withdraw", "Borrow", "Repay"];

	const [selectedToken, setSelectedToken] = useLocalStorageState(
		"terminal/moola-sec-lend/ticker",
		moolaSecLendTokens[0].symbol
	);
	const [selectedAction, setSelectedAction] = useLocalStorageState(
		"terminal/moola-sec-lend/actions",
		actions[0]
	);

	const registeredTickerList = useTickerList();
	if (!registeredTickerList.tickers.length) {
		setUpDefaultList();
		registeredTickerList.reload();
	}

	const tokenInfo: moolaSecLendToken =
		moolaSecLendTokens.find((e) => e.symbol === selectedToken) || DEFAULT_TOKEN;

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

	const tokenNames = moolaSecLendTokens.map((t) => t.symbol);
	const userOnchainState = useUserOnChainState(account, tokenAddress);

	const isFetching = accountState.isFetching || userOnchainState.isFetching;

	if (!MOOLA_SEC_LEND_AVAILABLE_CHAIN_IDS.includes(CFG().chainId.toString())) {
		throw new Error(`Moola is not available on chainId: ${CFG().chainId}!`);
	}

	let lendingPoolAddress: string;
	if (userOnchainState.fetched) {
		({ lendingPoolAddress } = userOnchainState.fetched);
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

				let approveAmount: BigNumber = amount;

				if (!BN(amount).isEqualTo(BN(MAX_UINT_256))) {
					approveAmount = BN(amount).multipliedBy("1.001");
				}

				// approve
				const tokenContract = await newErc20(kit, tokenInfo);
				const txApprove = tokenContract.approve(
					lendingPoolAddress,
					approveAmount
				);

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
	};

	const registeredTickerListSet = new Set(
		registeredTickerList.tickers.map((t) => selectAddressOrThrow(t.addresses))
	);
	const registeredTickersObject = moolaSecLendTokens.filter((t) => {
		const address = selectAddressOrThrow(t.addresses);
		return registeredTickerListSet.has(address);
	});

	const handleAddRegisteredTicker = (ticker: moolaSecLendToken) => {
		setSelectedToken(ticker.symbol);
		registeredTickerList.reload();
	};

	const handleRemoveRegisteredTicker = (ticker: moolaSecLendToken) => {
		if (ticker.symbol === selectedToken) {
			setSelectedToken(DEFAULT_TOKEN.symbol);
		}

		registeredTickerList.reload();
	};

	return (
		<AppContainer>
			<AppHeader
				app={MoolaSecLend}
				isFetching={isFetching}
				refetch={refetchAll}
			/>

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
						<SelectTicker
							tickers={registeredTickersObject}
							selected={selectedToken}
							onSelect={(t) => setSelectedToken(t.symbol)}
							onAddTickers={handleAddRegisteredTicker}
							onRemoveTickers={handleRemoveRegisteredTicker}
						/>
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

			<div>
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
							userOnchainState.fetched?.userReserveData ||
							defaultUserReserveData
						}
					/>
				</AppSection>
			</div>
		</AppContainer>
	);
};
export default MoolaSecLendApp;
