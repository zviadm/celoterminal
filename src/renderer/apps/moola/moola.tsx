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

import AppHeader from "../../components/app-header";
import AppSection from "../../components/app-section";
import AppContainer from "../../components/app-container";

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

const MoolaApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [tab, setTab] = useLocalStorageState("terminal/moola/tab", "deposit")
	const account = props.selectedAccount


	const runTXs = (f: TXFunc) => {
		props.runTXs(f, (e?: Error) => {
			refetch()
			if (!e) {
				console.log("add reset actions here //TODO--")
			}
		})
	}
	
	const erc20List = useErc20List()
	const [selectedToken, setSelectedToken] = useLocalStorageState("terminal/moola/erc20", erc20List.erc20s[0].symbol)

	const tokenNames = moolaTokens.map((t) => t.symbol)

	const {
			isFetching,
			fetched,
			refetch,
	} = useUserOnChainState(account, selectedToken) 
	
	const handleApprove = (spender: string, amount: BigNumber) => {
		const token = erc20List.erc20s.find(e => e.symbol === selectedToken)

		runTXs(
			async (kit: ContractKit) => {
				const contract = await newErc20(kit, token!)
				const tx = contract.approve(spender, amount)
				return [{tx: tx}]
			}
		)
	}

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
						<Deposit onApprove={(amount: BigNumber) => handleApprove(fetched?.lendingPoolAddress, amount)} />
					</TabPanel>
					<TabPanel value="withdraw">
						<Withdraw />
					</TabPanel>
					<TabPanel value="borrow">
						<Borrow />
					</TabPanel>
					<TabPanel value="repay">
						<Repay />
				</TabPanel>
				</AppSection>
				</TabContext>
		</AppContainer>
	);
};
export default MoolaApp;
