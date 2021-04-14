import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'

import { SavingsKit, savingsToCELO } from 'savingscelo'
import { newSavingsCELOWithUbeKit } from 'savingscelo-with-ube'

import { Account } from '../../../lib/accounts/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { SavingsCELO } from './def'
import useOnChainState from '../../state/onchain-state'
import { alfajoresChainId, CFG, registeredErc20s } from '../../../lib/cfg'
import { UserError } from '../../../lib/error'
import { coreErc20Decimals } from '../../../lib/erc20/core'
import { fmtAmount } from '../../../lib/utils'
import useLocalStorageState from '../../state/localstorage-state'
import { addRegisteredErc20 } from '../../state/erc20list-state'

import * as React from 'react'
import {
	Box, Button, Tab, Typography
} from '@material-ui/core'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'
import HelpOutline from '@material-ui/icons/HelpOutline'
import Alert from '@material-ui/lab/Alert'

import AppHeader from '../../components/app-header'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import SectionTitle from '../../components/section-title'
import NumberInput from '../../components/number-input'
import PendingWithdrawals from '../locker/pending-withdrawals'
import Link from '../../components/link'
import ubeswapIcon from './ubeswap-icon.png'
import SellOnUbe from './sell-on-ube'

const savingsWithUbeAddresses: {[key: string]: string} = {
	[alfajoresChainId]: "0x265f3762eb22CFBEb9D8fa00bBc9159e1aF01dA8",
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
			const celoAmount = goldToken.balanceOf(account.address)
			const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
			const reserves = sKit.reserves()
			const pendingWithdrawals = sKit.savingsKit.pendingWithdrawals(account.address)
			const savingsSupplies = await sKit.savingsKit.totalSupplies()
			const sCELOAmount = new BigNumber(
				await sKit.savingsKit.contract.methods.balanceOf(account.address).call())
			const sCELOasCELO = savingsToCELO(
				sCELOAmount, savingsSupplies.savingsTotal, savingsSupplies.celoTotal)
			if (sCELOAmount.gt(0)) {
				addRegisteredErc20("sCELO")
			}
			return {
				celoAmount: await celoAmount,
				pendingWithdrawals: await pendingWithdrawals,
				sCELOAmount,
				sCELOasCELO,
				ubeReserves: await reserves,
				savingsSupplies,
			}
		},
		[account],
	))
	const [toDeposit, setToDeposit] = React.useState("")
	const [toWithdraw, setToWithdraw] = React.useState("")

	const maxToDeposit = fetched?.celoAmount && BigNumber.maximum(
		fetched.celoAmount.shiftedBy(-coreErc20Decimals).minus(0.0001), 0)
	const canDeposit = maxToDeposit?.gte(toDeposit)
	const maxToWithdraw = fetched?.sCELOasCELO.shiftedBy(-coreErc20Decimals)
	const canWithdraw = maxToWithdraw?.gte(toWithdraw)

	const onFinishTXs = () => {
		refetch()
		setToDeposit("")
		setToWithdraw("")
	}
	const handleDeposit = () => {
		props.runTXs(
			async (kit: ContractKit) => {
				const sKit = await newSavingsCELOWithUbeKit(kit, savingsWithUbeAddress)
				const amount = new BigNumber(toDeposit).shiftedBy(coreErc20Decimals)
				const tx = sKit.deposit()
				return [{tx: tx, params: {value: amount.toFixed(0)}}]
			},
			onFinishTXs,
		)
	}
	const handleWithdrawStart = () => {
		props.runTXs(
			async (kit: ContractKit) => {
				if (!sCELO || !sCELO.address) { return [] }
				const sKit = new SavingsKit(kit, sCELO.address)
				const sCELOToWithdraw = (fetched && maxToWithdraw?.eq(toWithdraw)) ? fetched.sCELOAmount :
					await sKit.contract.methods.celoToSavings(
						new BigNumber(toWithdraw).shiftedBy(coreErc20Decimals).toString(10)).call()
				const tx = await sKit.withdrawStart(sCELOToWithdraw)
				return [{tx: tx}]
			},
			onFinishTXs,
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
			onFinishTXs,
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
			onFinishTXs,
		)
	}

	return (
		<AppContainer>
			<AppHeader app={SavingsCELO} isFetching={isFetching} refetch={refetch} />
			{fetched && <>
			<AppSection>
				<Typography>
					<SectionTitle>
						Savings Balance
						<Link href="https://github.com/zviadm/savingscelo/wiki#usage">
							<HelpOutline style={{fontSize: 16, marginLeft: 4, verticalAlign: "text-top"}}/>
						</Link>
					</SectionTitle>
					~{fmtAmount(fetched.sCELOasCELO, "CELO")} CELO&nbsp;
					<Typography color="textSecondary" component="span">
						(= {fmtAmount(fetched.sCELOAmount, sCELO.decimals)} sCELO)
					</Typography>
				</Typography>
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
						<Box display="flex" flexDirection="column">
							<Alert severity="info" style={{marginBottom: 10}}>
								If you want to provide liquidity to CELO+sCELO Ubeswap pool, go to the Ubeswap
								tab directly. From there, you can safely convert portion of your CELO to
								sCELO and add liquidity to Ubeswap in correct proportions, all in a single transaction.
							</Alert>
							<NumberInput
								autoFocus
								margin="dense"
								variant="outlined"
								id="deposit-celo-input"
								label={`Deposit (max: ${fmtAmount(fetched.celoAmount, "CELO")})`}
								InputLabelProps={{shrink: true}}
								value={toDeposit}
								onChangeValue={setToDeposit}
								maxValue={maxToDeposit}
							/>
							<Button
								id="deposit"
								color="primary"
								variant="outlined"
								disabled={!canDeposit}
								onClick={handleDeposit}>Deposit</Button>
						</Box>
					</TabPanel>
					<TabPanel value="withdraw">
						<Box display="flex" flexDirection="column">
							<NumberInput
								autoFocus
								margin="dense"
								variant="outlined"
								id="withdraw-celo-input"
								label={`Withdraw (max: ${fmtAmount(fetched.sCELOasCELO, "CELO")})`}
								InputLabelProps={{shrink: true}}
								value={toWithdraw}
								onChangeValue={setToWithdraw}
								maxValue={maxToWithdraw}
							/>
							<Button
								id="withdraw"
								color="primary"
								variant="outlined"
								disabled={!canWithdraw}
								onClick={handleWithdrawStart}>Withdraw</Button>
						</Box>
					</TabPanel>
					<TabPanel value="sell">
						<SellOnUbe
							sCELOasCELO={fetched.sCELOasCELO}
							ubeReserve_CELO={fetched.ubeReserves.reserve_CELO}
							ubeReserve_sCELO={fetched.ubeReserves.reserve_sCELO}
							savingsTotal_CELO={fetched.savingsSupplies.celoTotal}
							savingsTotal_sCELO={fetched.savingsSupplies.savingsTotal}
						/>
					</TabPanel>
					<TabPanel value="ubeswap">

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
			</TabContext>
			</>}
		</AppContainer>
	)
}
export default SavingsCELOApp

