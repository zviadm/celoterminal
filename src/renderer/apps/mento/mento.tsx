import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'

import { Account } from '../../../lib/accounts'
import { TXFunc, TXFinishFunc, Transaction } from '../../components/app-definition'
import { Mento } from './def'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtAmount } from '../../../lib/utils'
import { StableTokens } from './config'
import { calcCeloAmount, calcStableAmount, fmtTradeAmount } from './rate-utils'
import { useExchangeHistoryState, useExchangeOnChainState } from './state'

import * as React from 'react'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import Tooltip from '@material-ui/core/Tooltip'

import AppHeader from '../../components/app-header'
import ConfirmSwap from './confirm-swap'
import TradeHistory from './trade-history'
import NumberInput from '../../components/number-input'
import { coreErc20Decimals } from '../../../lib/erc20/core'

const MentoApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [stableToken, setStableToken] = useLocalStorageState("terminal/mento/stable-token", "cUSD")
	const [side, setSide] = useLocalStorageState<"buy" | "sell">("terminal/mento/side", "sell")
	const [celoAmount, setCeloAmount] = React.useState("")
	const [stableAmount, setStableAmount] = React.useState("")
	const slippageOptions = ["0.1", "0.5", "1.0"]
	const [slippagePct, setSlippagePct] = useLocalStorageState("terminal/mento/max-slippage", slippageOptions[1])
	if (slippageOptions.indexOf(slippagePct) === -1) {
		setSlippagePct(slippageOptions[1])
	}

	const account = props.selectedAccount
	const {
		isFetching,
		fetched,
		refetch,
	} = useExchangeOnChainState(account, stableToken)
	const exchangeHistory = useExchangeHistoryState(account)
	const refetchAll = () => {
		refetch()
		exchangeHistory.refetch()
	}

	React.useEffect(() => {
		const timer = setInterval(() => { refetch() }, 20000)
		return () => { clearInterval(timer) }
	}, [refetch])

	const [anchorToken, setAnchorToken] = React.useState<"celo" | "stable">("celo")
	React.useEffect(() => {
		if (!fetched) {
			return
		}
		if (anchorToken === "celo") {
			const stableAmountN = calcStableAmount(
				side,
				new BigNumber(celoAmount).shiftedBy(coreErc20Decimals),
				fetched.celoBucket, fetched.stableBucket, fetched.spread)
			setStableAmount(fmtTradeAmount(stableAmountN, side === "sell" ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP))
		} else {
			const celoAmountN = calcCeloAmount(
				side,
				new BigNumber(stableAmount).shiftedBy(coreErc20Decimals),
				fetched.celoBucket, fetched.stableBucket, fetched.spread)
			setCeloAmount(fmtTradeAmount(celoAmountN, side === "buy" ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP))
		}
		return
	}, [fetched, anchorToken, celoAmount, stableAmount, side])

	const [confirming, setConfirming] = React.useState<{
		side: "sell" | "buy",
		stableToken: string,
		celoAmount: string,
		stableAmount: string,
		slippagePct: string,
		marketPrice: BigNumber,
		spread: BigNumber,
	} | undefined>()

	const runTXs = (f: TXFunc) => {
		props.runTXs(f, (e?: Error) => {
			refetchAll()
			if (!e) {
				setCeloAmount("")
				setStableAmount("")
			}
		})
	}
	const stableNames = Object.keys(StableTokens)
	const handleChangeStable = (t: string) => {
		setAnchorToken("celo")
		setStableToken(t)
	}
	const handleChangeCeloAmt = (amt: string) => {
		anchorToken !== "celo" && setAnchorToken("celo")
		setCeloAmount(amt)
	}
	const handleChangeStableAmt = (amt: string) => {
		anchorToken !== "stable" && setAnchorToken("stable")
		setStableAmount(amt)
	}
	const setSideSell = () => { setSide("sell") }
	const setSideBuy = () => { setSide("buy") }

	const handleSell = (
		stableToken: string,
		sellCELO: boolean,
		sellAmount: BigNumber,
		minAmount: BigNumber) => {
		setConfirming(undefined)
		runTXs(async (kit: ContractKit) => {
			// TODO(zviadm): support multi exchange.
			const exchange = await kit.contracts.getExchange()
			const txSwap = exchange.sell(sellAmount, minAmount, sellCELO)
			// Set explicit gas based on github.com/celo-org/celo-monorepo/issues/2541
			const txs: Transaction[] = [{tx: txSwap, params: {gas: 300000}}]

			const approveC = await (
				sellCELO ?
				kit.contracts.getGoldToken() :
				StableTokens[stableToken](kit))
			const allowed = await approveC.allowance(account.address, exchange.address)
			if (allowed.lt(sellAmount)) {
				// Exchange is a core-contract, thus infinite-approval should be safe.
				const txApprove = approveC.increaseAllowance(exchange.address, 1e35)
				txs.unshift({tx: txApprove})
			}
			return txs
		})
	}

	const canTrade = fetched && (
		(side === "sell" && fetched.celoBalance.shiftedBy(-coreErc20Decimals).gt(celoAmount)) ||
		(side === "buy" && fetched.stableBalance.shiftedBy(-coreErc20Decimals).gt(stableAmount))
		)

	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader
				app={Mento}
				isFetching={isFetching || exchangeHistory.isFetching}
				refetch={refetchAll}
				/>
			{confirming && <ConfirmSwap
				{...confirming}
				onConfirmSell={handleSell}
				onCancel={() => setConfirming(undefined)}
			/>}
			<Box marginTop={2}>
				<Paper>
					<Box p={2}>
						<Box display="flex" flexDirection="row" alignItems="flex-end">
							<Box display="flex" flex={1}>
								<Box display="flex" flexDirection="column" width={150}>
									<Button
										style={{textTransform: "none"}}
										variant={side === "sell" ? "contained" : "text"}
										color={side === "sell" ? "primary" : "default"}
										onClick={setSideSell}
										>
										Sell CELO
									</Button>
								</Box>
								<Box display="flex" flexDirection="column" width={150}>
									<Button
										style={{textTransform: "none"}}
										variant={side === "buy" ? "contained" : "text"}
										color={side === "buy" ? "primary" : "default"}
										onClick={setSideBuy}
										>
										Buy CELO
									</Button>
								</Box>
							</Box>
							<Select
								value={stableToken}
								onChange={(event) => { handleChangeStable(event.target.value as string) }}>
								{
									stableNames.map((token) => (
										<MenuItem value={token} key={token}>{token}</MenuItem>
									))
								}
							</Select>
						</Box>
						<Box display="flex" flexDirection={side === "sell" ? "column" : "column-reverse"}>
							<NumberInput
								margin="normal"
								label={
									(!fetched || side !== "sell") ? `CELO` :
									`CELO (max: ${fmtAmount(fetched.celoBalance, coreErc20Decimals)})`}
								InputLabelProps={{
									shrink: true,
								}}
								value={celoAmount}
								placeholder="0.0"
								onChangeValue={handleChangeCeloAmt}
								disabled={!fetched}
							/>
							<NumberInput
								margin="normal"
								label={
									(!fetched || side !== "buy") ? `${stableToken}` :
									`${stableToken} (max: ${fmtAmount(fetched.stableBalance, coreErc20Decimals)})`}
								InputLabelProps={{
									shrink: true,
								}}
								value={stableAmount}
								placeholder="0.0"
								onChangeValue={handleChangeStableAmt}
								disabled={!fetched}
							/>
						</Box>
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
											<HelpOutlineIcon style={{fontSize: 12}}/>
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
							<Box display="flex" flexDirection="column" width={200}>
								<Button
									color="primary"
									variant="outlined"
									disabled={!canTrade}
									onClick={() => {
										if (!fetched) {
											return
										}
										setConfirming({
											side,
											celoAmount,
											stableToken,
											stableAmount,
											slippagePct,
											marketPrice: fetched.stableBucket.div(fetched.celoBucket),
											spread: fetched.spread,
										})
									}}
									>Trade</Button>
							</Box>
						</Box>
					</Box>
				</Paper>
			</Box>
			<Box marginTop={2}><TradeHistory events={exchangeHistory.fetched} /></Box>
		</Box>
	)
}
export default MentoApp


