import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { Route, swapTX } from '@terminal-fi/swappa'

import { Account } from '../../../lib/accounts/accounts'
import { TXFunc, TXFinishFunc, Transaction } from '../../components/app-definition'
import { Swappa } from './def'
import useLocalStorageState from '../../state/localstorage-state'
import { coreErc20_CELO, coreErc20_cUSD, Erc20InfiniteAmount, RegisteredErc20 } from '../../../lib/erc20/core'
import Erc20Contract, { erc20StaticAddress, newErc20 } from '../../../lib/erc20/erc20-contract'
import { routerAddr, useSwappaHistoryState, useSwappaRouterState } from './state'
import { useErc20List } from '../../state/erc20list-state'
import { fmtTradeAmount } from './utils'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	Box, Typography, Button, Tooltip, TextField
} from '@material-ui/core'
import HelpOutline from '@material-ui/icons/HelpOutline'

import AppHeader from '../../components/app-header'
import ConfirmSwap from './confirm-swap'
import NumberInput from '../../components/number-input'
import AppSection from '../../components/app-section'
import AppContainer from '../../components/app-container'
import SelectErc20 from '../../components/select-erc20'
import TradeHistory from './trade-history'
import SwapRoute from './swap-route'
import useOnChainState from '../../state/onchain-state'

const SwappaApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const erc20List = useErc20List()
	const [_inputTokenSymbol, setInputTokenSymbol] = useLocalStorageState("terminal/swappa/input_token", "CELO")
	const [_outputTokenSymbol, setOutputTokenSymbol] = useLocalStorageState("terminal/swappa/output_token", "cUSD")
	const inputToken = erc20List.erc20s.find((x) => x.symbol === _inputTokenSymbol) || coreErc20_CELO
	if (inputToken.symbol !== _inputTokenSymbol) {
		setInputTokenSymbol(inputToken.symbol)
	}
	const outputToken = erc20List.erc20s.find((x) => x.symbol === _outputTokenSymbol) || coreErc20_cUSD
	if (outputToken.symbol !== _outputTokenSymbol) {
		setOutputTokenSymbol(outputToken.symbol)
	}
	const [inputAmount, setInputAmount] = React.useState("")
	const [trade, setTrade] = React.useState<{
		outputToken: RegisteredErc20,
		inputAmount: string,
	} | undefined>()
	React.useEffect(() => {
		if (!inputAmount) {
			setTrade(undefined)
			return
		}
		const _trade = {outputToken, inputAmount}
		const tId = setTimeout(() => { setTrade(_trade) }, 200)
		return () => { clearTimeout(tId) }
	}, [outputToken, inputAmount])

	const slippageOptions = ["0.1", "0.5", "1.0"]
	const [slippagePct, setSlippagePct] = useLocalStorageState("terminal/swappa/max-slippage", slippageOptions[1])
	if (slippageOptions.indexOf(slippagePct) === -1) {
		setSlippagePct(slippageOptions[1])
	}

	const account = props.selectedAccount
	const accountState = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const inputErc20 = await newErc20(kit, inputToken)
			const inputBalance = await inputErc20.balanceOf(account.address)
			return {
				inputBalance,
			}
		},
		[account, inputToken],
	))
	const routerState = useSwappaRouterState(erc20List.erc20s, inputToken, trade)
	const swappaHistory = useSwappaHistoryState(account)
	const refetch = () => {
		accountState.refetch()
		routerState.refetch()
		swappaHistory.refetch()
	}
	const isFetching = accountState.isFetching || routerState.isFetching || swappaHistory.isFetching

	const inputAmountN = new BigNumber(inputAmount).shiftedBy(inputToken.decimals)
	const notEnoughBalance = accountState.fetched?.inputBalance.lt(inputAmountN)
	const estimatedPrice = routerState.tradeRoute?.route?.outputAmount.shiftedBy(-outputToken.decimals).div(
			routerState.tradeRoute.inputAmount.shiftedBy(-inputToken.decimals))

	const [confirming, setConfirming] = React.useState<{
		route: Route,
		inputAmount: BigNumber,
		slippagePct: string,
	} | undefined>()

	const handleSwap = (
		route: Route,
		inputAmount: BigNumber,
		minOutputAmount: BigNumber,
	) => {
		setConfirming(undefined)
		props.runTXs(
			async (kit: ContractKit) => {
				if (!routerAddr) {
					throw new Error("Unexpected error!")
				}
				const tx = swapTX(kit, routerAddr, route, inputAmount, minOutputAmount, account.address)
				const txs: Transaction[] = [{tx: tx}]

				const erc20 = new Erc20Contract(kit, route.path[0])
				const allowed = await erc20.allowance(account.address, routerAddr)
				if (allowed.lt(inputAmount)) {
					const txApprove = erc20.approve(routerAddr, Erc20InfiniteAmount.toString(10))
					txs.unshift({tx: txApprove})
				}
				return txs
			},
			(e?: Error) => {
				refetch()
				if (!e) {
					setInputAmount("")
				}
			}
		)
	}

	return (
		<AppContainer>
			<AppHeader
				app={Swappa}
				isFetching={isFetching}
				refetch={refetch}
				/>
			{confirming &&
			<ConfirmSwap
				{...confirming}
				extraErc20s={erc20List.erc20s}
				onConfirmSwap={handleSwap}
				onCancel={() => setConfirming(undefined)}
			/>}
			<AppSection>
				<Box display="flex" flexDirection="row">
					<NumberInput
						id="sell-amount-input"
						margin="normal"
						label={
							`From` +
							(accountState.fetched ?
								` (max: ${fmtTradeAmount(accountState.fetched.inputBalance, inputToken.decimals)})` : "")}
						InputLabelProps={{
							shrink: true,
						}}
						value={inputAmount}
						maxValue={accountState.fetched?.inputBalance.shiftedBy(-inputToken.decimals)}
						placeholder="0.0"
						onChangeValue={(v) => { setInputAmount(v) }}
					/>
					<Box
						display="flex"
						flexDirection="column"
						justifyContent="flex-end"
						minWidth={150}
						paddingBottom={1}
						marginLeft={2}>
						<SelectErc20
							erc20s={erc20List.erc20s}
							selected={inputToken}
							onSelect={(erc20) => {
								setInputTokenSymbol(erc20.symbol)
							}}
							onAddToken={(erc20) => {
								erc20List.reload()
								setInputTokenSymbol(erc20.symbol)
							}}
							onRemoveToken={() => { erc20List.reload() }}
						/>
					</Box>
				</Box>
				<Box display="flex" flexDirection="row">
					<TextField
						id="buy-amount-input"
						margin="normal"
						size="medium"
						fullWidth={true}
						label={`To`}
						InputLabelProps={{
							shrink: true,
						}}
						value={
							(trade && !routerState.tradeRoute) ? "Initializing..." :
							(routerState.tradeRoute) ?
								((routerState.tradeRoute.route &&
									erc20StaticAddress(outputToken) === routerState.tradeRoute.route?.outputToken) ?
									fmtTradeAmount(routerState.tradeRoute.route.outputAmount, outputToken.decimals) :
									"Trade route not found!"
								) :
								""
						}
						placeholder=""
						disabled={true}
					/>
					<Box
						display="flex"
						flexDirection="column"
						justifyContent="flex-end"
						minWidth={150}
						paddingBottom={1}
						marginLeft={2}>
						<SelectErc20
							erc20s={erc20List.erc20s}
							selected={outputToken}
							onSelect={(erc20) => {
								setOutputTokenSymbol(erc20.symbol)
							}}
							onAddToken={(erc20) => {
								erc20List.reload()
								setOutputTokenSymbol(erc20.symbol)
							}}
							onRemoveToken={() => { erc20List.reload() }}
						/>
					</Box>
				</Box>
				{routerState.tradeRoute?.route &&
				<SwapRoute route={routerState.tradeRoute.route} extraErc20s={erc20List.erc20s} />}
				{estimatedPrice &&
				<Box
					display="flex" flexDirection="row" justifyContent="flex-end"
					marginTop={1}>
					<Typography color="textSecondary" variant="caption">
						1 {inputToken.symbol} ~ {fmtAmount(estimatedPrice, 0, 4)} {outputToken.symbol} <br/>
						1 {outputToken.symbol} ~ {fmtAmount(new BigNumber(1).div(estimatedPrice), 0, 4)} {inputToken.symbol}
					</Typography>
				</Box>}
				<Box
					display="flex"
					flexDirection="row"
					alignItems="flex-end"
					justifyContent="space-between"
					marginTop={1}>
					<Box display="flex" flexDirection="column" alignItems="flex-end">
						<Box display="flex" flexDirection="column">
							<Typography variant="caption">
								Max slippage
								<Tooltip title="Your transaction will revert if the price changes unfavourably by more than this percentage.">
									<HelpOutline style={{fontSize: 12}}/>
								</Tooltip>
							</Typography>
							<Box display="flex" flexDirection="row">
								{
								slippageOptions.map((o) => (
									<Button
										key={`slippage-${o}`}
										variant={o === slippagePct ? "outlined" : "text"}
										onClick={() => { setSlippagePct(o) }}
										>{o}%</Button>
								))
								}
							</Box>
						</Box>
					</Box>
					<Tooltip title={notEnoughBalance ? "Not enough balance to trade!" : ""}>
					<Box display="flex" flexDirection="column" width={200}>
						<Button
							color="primary"
							variant="outlined"
							disabled={!routerState.tradeRoute?.route || !accountState.fetched?.inputBalance || notEnoughBalance }
							onClick={() => {
								if (!routerState.tradeRoute?.route) {
									return
								}
								setConfirming({
									route: routerState.tradeRoute.route,
									inputAmount: routerState.tradeRoute.inputAmount,
									slippagePct,
								})
							}}
							>Trade</Button>
					</Box>
					</Tooltip>
				</Box>
			</AppSection>
			<AppSection>
				<TradeHistory events={swappaHistory.fetched} extraErc20s={erc20List.erc20s} />
			</AppSection>
		</AppContainer>
	)
}
export default SwappaApp
