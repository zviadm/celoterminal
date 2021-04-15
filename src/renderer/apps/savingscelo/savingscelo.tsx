import { ContractKit } from '@celo/contractkit'
import { toTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'

import { SavingsKit, savingsToCELO } from 'savingscelo'
import {
	newSavingsCELOWithUbeKit,
	SavingsCELOWithUbeV1AddressAlfajores,
	SavingsCELOWithUbeV1AddressMainnet,
} from 'savingscelo-with-ube'

import { Account } from '../../../lib/accounts/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { SavingsCELO } from './def'
import useOnChainState from '../../state/onchain-state'
import { alfajoresChainId, CFG, mainnetChainId, registeredErc20s } from '../../../lib/cfg'
import { UserError } from '../../../lib/error'
import { fmtAmount } from '../../../lib/utils'
import { addRegisteredErc20 } from '../../state/erc20list-state'
import useLocalStorageState from '../../state/localstorage-state'
import { Erc20InfiniteAmount } from '../../../lib/erc20/core'

import * as React from 'react'
import {
	Box, Tab, Typography,
	Table, TableBody, TableRow, TableCell,
} from '@material-ui/core'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'
import HelpOutline from '@material-ui/icons/HelpOutline'
import ubeswapIcon from './ubeswap-icon.png'

import AppHeader from '../../components/app-header'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import SectionTitle from '../../components/section-title'
import PendingWithdrawals from '../locker/pending-withdrawals'
import Link from '../../components/link'
import SellOnUbe from './sell-on-ube'
import LPOnUbe from './lp-on-ube'
import Deposit from './deposit'
import Withdraw from './withdraw'
import RemoveLiquidity from './remove-liquidity'

const savingsWithUbeAddresses: {[key: string]: string} = {
	[alfajoresChainId]: SavingsCELOWithUbeV1AddressAlfajores,
	[mainnetChainId]: SavingsCELOWithUbeV1AddressMainnet,
}
const savingsWithUbeAddress: string = savingsWithUbeAddresses[CFG().chainId]
const sCELO = registeredErc20s.find((e) => e.symbol === "sCELO")

const SavingsCELOApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	if (!sCELO || !sCELO.address || !savingsWithUbeAddress) {
		throw new UserError(`SavingsCELO not supported on this network.`)
	}
	const [tab, setTab] = useLocalStorageState("terminal/savingscelo/tab", "deposit")
	const account = props.selectedAccount
	const {
		fetched,
		isFetching,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const goldToken = await kit.contracts.getGoldToken()
			const balance_CELO = goldToken.balanceOf(account.address)
			const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
			const reserves = sKit.reserves()
			const pendingWithdrawals = sKit.savingsKit.pendingWithdrawals(account.address)
			const _liquidityAmount = sKit.liquidityBalanceOf(account.address)
			const savingsTotals = await sKit.savingsKit.totalSupplies()
			const balance_sCELO = new BigNumber(
				await sKit.savingsKit.contract.methods.balanceOf(account.address).call())
			const sCELOasCELO = savingsToCELO(
				balance_sCELO, savingsTotals.savingsTotal, savingsTotals.celoTotal)
			if (balance_sCELO.gt(0)) {
				addRegisteredErc20("sCELO")
			}
			const liquidityTotal_ULP = new BigNumber(await sKit.pair.methods.totalSupply().call())
			const liquidityAmount = await _liquidityAmount
			if (liquidityAmount.liquidity.gt(0)) {
				addRegisteredErc20("ULP-CELO+sCELO")
			}
			const liquidityTotal_sCELOasCELO = savingsToCELO(
				liquidityAmount.balance_sCELO, savingsTotals.savingsTotal, savingsTotals.celoTotal)
			const liquidityTotal_CELO = liquidityAmount.balance_CELO.plus(liquidityTotal_sCELOasCELO)
			const liquidityRatio_CELO = liquidityAmount.balance_CELO.div(liquidityTotal_CELO)
			// TODO(zviad): is there alfajores link?
			const ubeswapPoolURL = `https://info.ubeswap.org/pair/${sKit.pair.options.address}`
			return {
				pendingWithdrawals: await pendingWithdrawals,
				balance_CELO: await balance_CELO,
				balance_sCELO,
				sCELOasCELO,
				balance_ULP: liquidityAmount.liquidity,
				liquidityTotal_ULP,
				liquidityTotal_CELO,
				liquidityRatio_CELO,
				ubeReserves: await reserves,
				savingsTotals,
				ubeswapPoolURL,
			}
		},
		[account],
	))

	const onFinishTXs = (cb?: (e?: Error) => void) => {
		return (e?: Error) => {
			refetch()
			if (cb) { cb(e) }
		}
	}
	const handleDeposit = (toDeposit_CELO: BigNumber, cb: (e?: Error) => void) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
				const tx = sKit.deposit()
				return [{tx: tx, params: {value: toDeposit_CELO.toString(10)}}]
			},
			onFinishTXs(cb),
		)
	}
	const handleWithdrawStart = (toWithdraw_CELO: BigNumber, cb: (e?: Error) => void) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (!sCELO || !sCELO.address) { return [] }
				const sKit = new SavingsKit(kit, sCELO.address)
				const tx = await sKit.withdrawStart(toWithdraw_CELO)
				return [{tx: tx}]
			},
			onFinishTXs(cb),
		)
	}
	const handleWithdrawFinish = (idx: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (!sCELO || !sCELO.address) { return [] }
				const sKit = new SavingsKit(kit, sCELO.address)
				const tx = await sKit.withdrawFinish(fetched?.pendingWithdrawals || [], idx)
				return [{tx: tx}]
			},
			onFinishTXs(),
		)
	}
	const handleWithdrawCancel = (idx: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (!sCELO || !sCELO.address) { return [] }
				const sKit = new SavingsKit(kit, sCELO.address)
				const tx = await sKit.withdrawCancel(fetched?.pendingWithdrawals || [], idx)
				return [{tx: tx}]
			},
			onFinishTXs(),
		)
	}
	const handleSellOnUbe = (
		toSell_sCELO: BigNumber,
		receiveMin_CELO: BigNumber,
		cb: (e?: Error) => void) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const goldToken = await kit.contracts.getGoldToken()
				const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
				// TODO(zviad): infinite approval.
				const allowance_sCELO = await sKit.savingsKit.contract.methods
					.allowance(account.address, sKit.router.options.address).call()
				const approveTXs = []
				if (toSell_sCELO.gt(allowance_sCELO)) {
					approveTXs.push(
						toTransactionObject(
							kit.connection,
							sKit.savingsKit.contract.methods.increaseAllowance(
								sKit.router.options.address,
								Erc20InfiniteAmount.toString(10)))
					)
				}
				const tx = toTransactionObject(
					kit.connection,
					sKit.router.methods.swapExactTokensForTokens(
						toSell_sCELO.toString(10),
						receiveMin_CELO.toString(10),
						[sKit.savingsKit.contractAddress, goldToken.address],
						account.address,
						// Use a long deadline to make sure user can confirm and send the transaction
						// in that time period.
						Math.floor((new Date().getTime() / 1000) + 600),
					))
				return [...approveTXs.map((tx) => ({tx: tx})), {tx: tx}]
			},
			onFinishTXs(cb),
		)
	}
	const handleAddLiquidity = (
		toAdd_CELO: BigNumber,
		toAdd_sCELO: BigNumber,
		maxReserveRatio: BigNumber,
		cb: (e?: Error) => void) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
				const approveTXs = await sKit.approveAddLiquidity(account.address, toAdd_CELO, toAdd_sCELO, true)
				const tx = await sKit.addLiquidity(toAdd_CELO, toAdd_sCELO, maxReserveRatio)
				return [...approveTXs.map((tx) => ({tx: tx})), {tx: tx}]
			},
			onFinishTXs(cb),
		)
	}
	const handleRemoveLiquidity = (
		toRemove_ULP: BigNumber,
		min_CELO: BigNumber,
		min_sCELO: BigNumber,
		cb: (e?: Error) => void) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
				const approveTXs = await sKit.approveRemoveLiquidity(account.address, toRemove_ULP, true)
				const tx = await sKit.removeLiquidity(
					toRemove_ULP, min_CELO, min_sCELO,
					account.address,
					Math.floor((new Date().getTime() / 1000) + 600))
				return [...approveTXs.map((tx) => ({tx: tx})), {tx: tx}]
			},
			onFinishTXs(cb),
		)
	}

	return (
		<AppContainer>
			<AppHeader app={SavingsCELO} isFetching={isFetching} refetch={refetch} />
			{fetched && <>
			<AppSection>
				<SectionTitle>
					Savings Balance
					<Link href="https://github.com/zviadm/savingscelo/wiki#usage">
						<HelpOutline style={{fontSize: 16, marginLeft: 4, verticalAlign: "text-top"}}/>
					</Link>
				</SectionTitle>
				<Table size="small">
					<TableBody>
						<TableRow>
							<TableCell>Savings</TableCell>
							<TableCell>
								~{fmtAmount(fetched.sCELOasCELO, "CELO")} CELO&nbsp;
								<Typography color="textSecondary" component="span">
									(= {fmtAmount(fetched.balance_sCELO, sCELO.decimals)} sCELO)
								</Typography>
							</TableCell>
						</TableRow>
						{fetched.liquidityTotal_CELO.gt(0) &&
						<TableRow>
							<TableCell>Ubeswap LP</TableCell>
							<TableCell>
								~{fmtAmount(fetched.liquidityTotal_CELO, "CELO")} CELO&nbsp;
								({fetched.liquidityRatio_CELO.multipliedBy(100).toFixed(0)}% CELO&nbsp;/&nbsp;
								{fetched.liquidityRatio_CELO.minus(1).negated().multipliedBy(100).toFixed(0)}% sCELO)
							</TableCell>
						</TableRow>}
					</TableBody>
				</Table>
			</AppSection>
			<TabContext value={tab}>
				<AppSection innerPadding={0}>
					<TabList onChange={(e, v) => { setTab(v) }}>
						<Tab value={"deposit"} label="Deposit" />
						<Tab value={"withdraw"} label="Withdraw" />
						<Tab
							value={"sell"}
							label={<Box display="flex">
								<span style={{marginRight: 5}}>Sell</span>
								<img src={ubeswapIcon} width={20} />
							</Box>}
						/>
						<Tab
							value={"ubeswap"}
							label={<Box display="flex">
								<span style={{marginRight: 5}}>Ubeswap</span>
								<img src={ubeswapIcon} width={20} />
							</Box>}
						/>
					</TabList>
					<TabPanel value="deposit">
						<Deposit
							balance_CELO={fetched.balance_CELO}
							onDeposit={handleDeposit}
						/>
					</TabPanel>
					<TabPanel value="withdraw">
						<Withdraw
							balance_sCELO={fetched.balance_sCELO}
							sCELOasCELO={fetched.sCELOasCELO}
							savingsTotal_CELO={fetched.savingsTotals.celoTotal}
							savingsTotal_sCELO={fetched.savingsTotals.savingsTotal}
							onWithdrawStart={handleWithdrawStart}
						/>
					</TabPanel>
					<TabPanel value="sell">
						<SellOnUbe
							balance_sCELO={fetched.balance_sCELO}
							sCELOasCELO={fetched.sCELOasCELO}
							ubeReserve_CELO={fetched.ubeReserves.reserve_CELO}
							ubeReserve_sCELO={fetched.ubeReserves.reserve_sCELO}
							savingsTotal_CELO={fetched.savingsTotals.celoTotal}
							savingsTotal_sCELO={fetched.savingsTotals.savingsTotal}
							ubeswapPoolURL={fetched.ubeswapPoolURL}
							onSell={handleSellOnUbe}
						/>
					</TabPanel>
					<TabPanel value="ubeswap">
						<LPOnUbe
							balance_CELO={fetched.balance_CELO}
							balance_sCELO={fetched.balance_sCELO}
							sCELOasCELO={fetched.sCELOasCELO}
							ubeReserve_CELO={fetched.ubeReserves.reserve_CELO}
							ubeReserve_sCELO={fetched.ubeReserves.reserve_sCELO}
							savingsTotal_CELO={fetched.savingsTotals.celoTotal}
							savingsTotal_sCELO={fetched.savingsTotals.savingsTotal}
							ubeswapPoolURL={fetched.ubeswapPoolURL}
							onAddLiquidity={handleAddLiquidity}
						/>
					</TabPanel>
				</AppSection>
				{tab === "withdraw" && fetched && fetched.pendingWithdrawals.length > 0 &&
				<AppSection>
					<PendingWithdrawals
						pendingWithdrawals={fetched.pendingWithdrawals}
						onWithdraw={handleWithdrawFinish}
						onCancel={handleWithdrawCancel}
					/>
				</AppSection>}
				{tab === "ubeswap" && fetched && fetched.balance_ULP.gt(0) &&
				<AppSection>
					<RemoveLiquidity
						balance_ULP={fetched.balance_ULP}
						total_ULP={fetched.liquidityTotal_ULP}
						ubeReserve_CELO={fetched.ubeReserves.reserve_CELO}
						ubeReserve_sCELO={fetched.ubeReserves.reserve_sCELO}
						savingsTotal_CELO={fetched.savingsTotals.celoTotal}
						savingsTotal_sCELO={fetched.savingsTotals.savingsTotal}
						onRemoveLiquidity={handleRemoveLiquidity}
					/>
				</AppSection>}
			</TabContext>
			</>}
		</AppContainer>
	)
}
export default SavingsCELOApp

