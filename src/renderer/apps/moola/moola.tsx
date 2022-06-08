import { Moola } from "./def";
import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'
import * as React from "react";
import { Box, Tab, Typography, Button, Tooltip, Select, MenuItem } from "@material-ui/core";
import { moolaTokens, TokenMenuItem } from './config'
import { Account } from '../../../lib/accounts/accounts'
import { TXFunc, TXFinishFunc, Transaction } from '../../components/app-definition'
import { newErc20, erc20StaticAddress } from '../../../lib/erc20/erc20-contract'
import { AbiItem, toTransactionObject } from '@celo/connect'
import AppHeader from "../../components/app-header";
import AppSection from "../../components/app-section";
import AppContainer from "../../components/app-container";
import { selectAddressOrThrow } from '../../../lib/cfg';
import SectionTitle from '../../components/section-title'

import Deposit from './deposit';
import Withdraw from './withdraw';
import Borrow from './borrow';
import Repay from './repay';
import AccountStatus from './account-status';
import CreditDelegationDelegator from './credit-delegation-delegator';
import CreditDelegationBorrower from './credit-delegation-borrower';
import AutoRepay from './auto-repay';
import RepayFromCollateral from "./repay-from-collateral";
import LiquiditySwap from "./liquidity-swap";

import useLocalStorageState from '../../state/localstorage-state'
import { useErc20List } from '../../state/erc20list-state'
import { useUserOnChainState } from './state'
import useOnChainState from '../../state/onchain-state'

import { abi as LendingPoolABI } from '@aave/protocol-v2/artifacts/contracts/protocol/lendingpool/LendingPool.sol/LendingPool.json';
import { abi as LendingPoolDataProviderABI } from '@aave/protocol-v2/artifacts/contracts/misc/AaveProtocolDataProvider.sol/AaveProtocolDataProvider.json';
import { abi as repayDelegationABI} from './abi/RepayDelegation.json';
import { abi as AutoRepayABI} from './abi/AutoRepay.json';
import { abi as MTokenABI} from './abi/Mtoken.json';
import { abi as PriceOracleABI } from './abi/PriceOracle.json';

import { BN, getTokenToSwapPrice, ALLOWANCE_THRESHOLD, MAX_UINT_256, buildLiquiditySwapParams, ZERO_ADDRESS } from './moola-helper';

const MoolaApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [tab, setTab] = useLocalStorageState("terminal/moola/tab", "deposit")
	const account = props.selectedAccount
	const actions =
		[
			'Deposit', 'Withdraw', 'Borrow', 'Repay',
			'Credit Delegation as Delegator',
			'Credit Delegation as Borrower',
			'Auto Repay',
			'Repay from Collateral',
			'Liquidity Swap',
		];
	// TODO-- add 'Repay from Collateral', 'Auto Repay', 'Liquidity Swap'

	const erc20List = useErc20List()
	const [selectedToken, setSelectedToken] = useLocalStorageState("terminal/moola/erc20", moolaTokens[0].symbol)
	const [selectedAction, setSelectedAction] = useLocalStorageState("terminal/moola/actions", actions[0])
	const tokenInfo = erc20List.erc20s.find(e => e.symbol === selectedToken)
	const tokenAddress = erc20StaticAddress(tokenInfo!)
	const accountState = useOnChainState(React.useCallback(
	async (kit: ContractKit) => {
		const selectedErc20 = await newErc20(kit, tokenInfo!)
		const balance = await selectedErc20.balanceOf(account.address)
		return {
			balance,
		}
	},
	[account, tokenInfo],
	))
	
	const tokenNames = moolaTokens.map((t) => t.symbol)
	const userOnchainState = useUserOnChainState(account, tokenAddress) 
	
	const isFetching = accountState.isFetching || userOnchainState.isFetching;

	const handleDeposit = (amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];

				// approve
				
				const tokenContract = await newErc20(kit, tokenInfo!)
				const txApprove = tokenContract.approve(userOnchainState.fetched!.lendingPoolAddress, amount)

				// deposit
				
				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], userOnchainState!.fetched!.lendingPoolAddress)
				const txDeposit =	toTransactionObject(
					kit.connection,
					LendingPool.methods.deposit(tokenAddress, amount, account.address, 0)
				)

				return [{ tx: txApprove}, { tx: txDeposit}]
			},
		() => { userOnchainState.refetch() })
	}

	const handleWithdraw = (amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];

				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], userOnchainState.fetched!.lendingPoolAddress)
				const tx =	toTransactionObject(
					kit.connection,
					LendingPool.methods.withdraw(tokenAddress, amount, account.address)
				)

				return [{ tx }];
			},
		() => { userOnchainState.refetch() }
		)
	}

	const handleBorrow = (rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];

				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], userOnchainState.fetched!.lendingPoolAddress)
				const tx =	toTransactionObject(
					kit.connection,
					LendingPool.methods.borrow(tokenAddress, amount, rateMode, 0, account.address)
				)

				return [{ tx }];
			},
		() => { userOnchainState.refetch() }
		)
	}

	const handleRepay = (rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];

				// approve
				const tokenContract = await newErc20(kit, tokenInfo!)
				const txApprove = tokenContract.approve(userOnchainState.fetched!.lendingPoolAddress, amount)
			
				// repay
				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], userOnchainState.fetched!.lendingPoolAddress)
				const txRepay =	toTransactionObject(
					kit.connection,
					LendingPool.methods.repay(tokenAddress, amount, rateMode, account.address)
				)

				return [{tx: txApprove}, { tx: txRepay }];
			},
		() => { userOnchainState.refetch() }
		)
	}

	const handleBorrowFrom = (deleagatorAddress: string, rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];

				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], userOnchainState.fetched!.lendingPoolAddress)
				const tx = toTransactionObject(
					kit.connection,
					LendingPool.methods.borrow(tokenAddress, amount, rateMode, 0, deleagatorAddress)
				)

				return [{ tx }]
			},
			() => {userOnchainState.refetch()}
		)
	}

	const handleRepayFor = (delegatorAddress: string,  rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];

				const repayDelegatorHelperContract = new kit.web3.eth.Contract(repayDelegationABI as AbiItem[], userOnchainState.fetched!.repayDelegationHelperAddress);
				// repayDelegatorHelperContract.

				return []
			},
			() => {userOnchainState.refetch()}
		)
	}

	const handleDelegate = (borrowerAddress: string, rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];
				// TODO-- approve debt token
				return []
			},
			() => {userOnchainState.refetch()}
		)
	}

	const handleSetAutoRepay = (minHealthFactor: BigNumber, maxHealthFactor: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];

				const AutoRepay = new kit.web3.eth.Contract(AutoRepayABI as AbiItem[], userOnchainState.fetched!.autoRepayAddress)
				const tx = toTransactionObject(
					kit.connection,
					AutoRepay.methods.setMinMaxHealthFactor(minHealthFactor, maxHealthFactor)
				)

				return [{ tx }];
			},
			() => {userOnchainState.refetch()}
		)
	}

	const handleRepayFromCollateral = (collateralAssetSymbol: string, debtAssetSymbol: string, rateMode: number, amount: BigNumber, useFlashLoan: boolean) => {
		console.log('hello', collateralAssetSymbol, debtAssetSymbol, rateMode, useFlashLoan, amount)
	 }

	const handleLiquiditySwap = (assetFromSymbol: string, assetToSymbol: string, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (isFetching) return [];

				if (assetFromSymbol === assetToSymbol) {
					return[];  // TODO-- show error
				}

				const txs = []
				const assetFromInfo = erc20List.erc20s.find(e => e.symbol === assetFromSymbol)
				const assetToInfo = erc20List.erc20s.find(e => e.symbol === assetToSymbol)
				const assetFromAddress = erc20StaticAddress(assetFromInfo!)
				const assetToAddress = erc20StaticAddress(assetToInfo!)
				const useAtokenAsFrom = assetFromSymbol != 'CELO';
				const useAtokenAsTo = assetToSymbol != 'CELO';
				
				const LendingPoolDataProvider = new kit.web3.eth.Contract(LendingPoolDataProviderABI as AbiItem[], userOnchainState.fetched!.lendingPoolDataProviderAddress)
				const reserveTokens = await LendingPoolDataProvider.methods.getReserveTokensAddresses(assetFromAddress).call();
				const mToken = new kit.web3.eth.Contract(MTokenABI as AbiItem[], reserveTokens.aTokenAddress);

				const PriceOracle = new kit.web3.eth.Contract(PriceOracleABI as AbiItem[], userOnchainState.fetched!.priceOracleAddress)
				const [tokenFromPrice, tokenToPrice] = await PriceOracle.methods.getAssetsPrices([assetFromAddress, assetToAddress]).call();

				const tokenSwapPrice = getTokenToSwapPrice(amount, tokenFromPrice, tokenToPrice)
				
				const currentAllowance = await mToken.methods.allowance(account.address, userOnchainState.fetched!.liquiditySwapAdapterAddress).call()
		
				if (BN(currentAllowance).isLessThan(ALLOWANCE_THRESHOLD)) {
					const approveTx = toTransactionObject(
						kit.connection,
							mToken.methods.approve(userOnchainState.fetched!.liquiditySwapAdapterAddress, MAX_UINT_256)
					) 
					txs.push({ tx: approveTx})
				}

				const liquiditySwapParams = buildLiquiditySwapParams([assetToAddress], [tokenSwapPrice], [false], [0], [0], [0], [ZERO_ADDRESS], [ZERO_ADDRESS], [false], [useAtokenAsFrom], [useAtokenAsTo])
				
				// TODO-- test on mainnet
				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], userOnchainState.fetched!.lendingPoolAddress);
				const liquiditySwapTx = toTransactionObject(
					kit.connection,
					LendingPool.methods.flashLoan(userOnchainState.fetched!.liquiditySwapAdapterAddress, [assetFromAddress], [amount], [0], account.address, liquiditySwapParams, 0)
				)
				txs.push({tx: liquiditySwapTx})

				return txs
			}

		)
	}

	const refetchAll = () => {
		accountState.refetch();
		userOnchainState.refetch();
	}

	const tokenBalance = accountState.fetched?.balance.shiftedBy(-tokenInfo!.decimals) || new BigNumber('0')
	const tokenMenuItems: JSX.Element[] = tokenNames.map((token) => (
								<MenuItem value={token} key={token}>{token}</MenuItem>
							))
	const actionComponents = {
		'Deposit': <Deposit
			onDeposit={handleDeposit}
			tokenBalance={tokenBalance}
		/>,
		'Withdraw': 
			<Withdraw onWithdraw={handleWithdraw}/>,
		'Borrow':
				
					<Borrow onBorrow={handleBorrow} />,
		'Repay':
			<Repay onRepay={handleRepay} tokenBalance={tokenBalance} />,
		'Credit Delegation as Borrower':
			<CreditDelegationBorrower onBorrowFrom={handleBorrowFrom} onRepayFor={handleRepayFor} />,
		'Credit Delegation as Delegator':
			<CreditDelegationDelegator onDelegate={handleDelegate} />,
					'Auto Repay': <AutoRepay onSetAutoRepay={handleSetAutoRepay}/>,
		'Repay from Collateral': <RepayFromCollateral onRepayFromCollateral={handleRepayFromCollateral} tokenMenuItems={tokenMenuItems} />,
		'Liquidity Swap': <LiquiditySwap onLiquiditySwap={handleLiquiditySwap} tokenMenuItems={tokenMenuItems}/>,
	}


	return (
		<AppContainer>
			<AppHeader
				app={Moola}
				isFetching={isFetching}
				refetch={refetchAll}
			/>
			<AppSection >
				<Box
					style={{ display: 'flex', justifyContent: 'space-between'}}
					marginTop={1}
				>
					<Box style={{ width: "45%"}}>
					<SectionTitle>Token</SectionTitle>
					<Select
						style={{ width: '100%'}}	
						value={selectedToken}
						onChange={(event) => { setSelectedToken(event.target.value) }}>
						{tokenMenuItems}
						</Select>
					</Box>
					<Box style={{ width: "45%"}}>
					<SectionTitle>Action</SectionTitle>
					<Select
						style={{ width: '100%'}}	
						value={selectedAction}
						onChange={(event) => { setSelectedAction(event.target.value) }}>
						{
							actions.map((action) => (
								<MenuItem value={action} key={action}>{action}</MenuItem>
							))
						}
						</Select>
						</Box>
				</Box>
			</AppSection>

			<AppSection>
				{actionComponents[selectedAction]}
			</AppSection>
			
			<AppSection>
				<AccountStatus
					tokenName={selectedToken}
					isFetching={isFetching}
					userReserveData={userOnchainState.fetched?.userReserveData}
				/>
			</AppSection>
		</AppContainer>
	);
};
export default MoolaApp;

// TODO-- make sure all events are happening in lending pool before adding recent activities
