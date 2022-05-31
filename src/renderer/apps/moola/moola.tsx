import { Moola } from "./def";
import BigNumber from 'bignumber.js'
import { ContractKit, StableToken } from '@celo/contractkit'
import Erc20Contract, { newErc20 } from '../../../lib/erc20/erc20-contract'
import * as React from "react";
import { Box, Tab, Typography, Button, Tooltip, Select, MenuItem } from "@material-ui/core";
import HelpOutline from "@material-ui/icons/HelpOutline";
import { stableTokens, moolaTokens } from './config'
import { Account } from '../../../lib/accounts/accounts'
import { TXFunc, TXFinishFunc, Transaction } from '../../components/app-definition'
import { AbiItem, toTransactionObject } from '@celo/connect'
import AppHeader from "../../components/app-header";
import AppSection from "../../components/app-section";
import AppContainer from "../../components/app-container";
import { selectAddressOrThrow } from '../../../lib/cfg';

import Deposit from './deposit';
import Withdraw from './withdraw';
import Borrow from './borrow';
import Repay from './repay';

import useLocalStorageState from '../../state/localstorage-state'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'
import { coreErc20s, coreErc20Decimals, RegisteredErc20 } from '../../../lib/erc20/core'
import { useErc20List } from '../../state/erc20list-state'
import { useUserOnChainState } from './state'

import { abi as LendingPoolABI } from '@aave/protocol-v2/artifacts/contracts/protocol/lendingpool/LendingPool.sol/LendingPool.json';
import { abi as LendingPoolAddressesProviderABI } from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json';

const MoolaApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [tab, setTab] = useLocalStorageState("terminal/moola/tab", "deposit")
	const account = props.selectedAccount

	const erc20List = useErc20List()
	const [selectedToken, setSelectedToken] = useLocalStorageState("terminal/moola/erc20", erc20List.erc20s[0].symbol)
	const tokenInfo = erc20List.erc20s.find(e => e.symbol === selectedToken)

	const tokenNames = moolaTokens.map((t) => t.symbol)
	const tokenAddress = selectAddressOrThrow(tokenInfo.addresses);
	const {
			isFetching,
			fetched,
			refetch,
	} = useUserOnChainState(account, tokenAddress) 

	const handleDeposit = (amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (!fetched) return [];

				// approve
				
				const tokenContract = await newErc20(kit, tokenInfo!)
				const txApprove = tokenContract.approve(fetched.lendingPoolAddress, amount)

				// deposit
				
				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], fetched.lendingPoolAddress)
				const txDeposit =	toTransactionObject(
					kit.connection,
					LendingPool.methods.deposit(tokenAddress, amount, account.address, 0)
				)

				return [{ tx: txApprove}, { tx: txDeposit}]
			},
		() => { refetch() })
	}

	const handleWithdraw = (amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (!fetched) return [];

				const token = erc20List.erc20s.find(e => e.symbol === selectedToken)
				const tokenAddress = selectAddressOrThrow(tokenInfo.addresses);
				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], fetched.lendingPoolAddress)
				const tx =	toTransactionObject(
					kit.connection,
					LendingPool.methods.withdraw(tokenAddress, amount, account.address)
				)

				return [{ tx }];
			}
		)
	}

	const handleBorrow = (rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (!fetched) return [];

				const token = erc20List.erc20s.find(e => e.symbol === selectedToken)
				const tokenAddress = selectAddressOrThrow(token.addresses);
				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], fetched.lendingPoolAddress)
				const tx =	toTransactionObject(
					kit.connection,
					LendingPool.methods.borrow(tokenAddress, amount, rateMode, 0, account.address)
				)

				return [{ tx }];
			}
		)
	}

	const handleRepay = (rateMode: number, amount: BigNumber) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (!fetched) return [];

				// approve
				const token = erc20List.erc20s.find(e => e.symbol === selectedToken)
				const tokenContract = await newErc20(kit, token!)
				const txApprove = tokenContract.approve(fetched.lendingPoolAddress, amount)
			
				// repay
				const tokenAddress = selectAddressOrThrow(token.addresses);
				const LendingPool = new kit.web3.eth.Contract(LendingPoolABI as AbiItem[], fetched.lendingPoolAddress)
				const txRepay =	toTransactionObject(
					kit.connection,
					LendingPool.methods.repay(tokenAddress, amount, rateMode, account.address)
				)

				return [{tx: txApprove}, { tx: txRepay }];
			}
		)
	}

	console.log('fetched :>> ', fetched);

	return (
		<AppContainer>
			<AppHeader
				app={Moola}
				isFetching={isFetching}
				refetch={refetch}
			/>
			<AppSection>
				<Box
					marginTop={1}
				>
					<Select
						style={{ width: "100%"}}
						value={selectedToken}
						onChange={(event) => { setSelectedToken(event.target.value) }}>
						{
							tokenNames.map((token) => (
								<MenuItem value={token} key={token}>{token}</MenuItem>
							))
						}
					</Select>
				</Box>
			</AppSection>
			<TabContext value={tab}>
			<AppSection>
				<TabList onChange={(_, v) => { setTab(v) }}>
						<Tab value={"deposit"} label="Deposit" />
						<Tab value={"withdraw"} label="Withdraw" />
						<Tab
							value={"borrow"}
							label="Borrow"
						/>
						<Tab
							value={"repay"}
							label="Repay"
						/>
					</TabList>
					<TabPanel value="deposit">
						<Deposit
							onDeposit={handleDeposit}
						/>
					</TabPanel>
					<TabPanel value="withdraw">
						<Withdraw onWithdraw={handleWithdraw}/>
					</TabPanel>
					<TabPanel value="borrow">
						<Borrow onBorrow={handleBorrow} />
					</TabPanel>
					<TabPanel value="repay">
						<Repay onRepay={handleRepay} />
				</TabPanel>
				</AppSection>
				</TabContext>
		</AppContainer>
	);
};
export default MoolaApp;
