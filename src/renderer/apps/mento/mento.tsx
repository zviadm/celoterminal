import { CeloContract, ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { Address, CeloTransactionObject } from '@celo/connect'
import { MedianRate } from '@celo/contractkit/lib/wrappers/SortedOracles'

import { Account } from '../../../lib/accounts'
import useOnChainState from '../../state/onchain-state'
import { TXFunc, TXFinishFunc, Transaction } from '../../components/app-definition'
import { Mento } from './def'
import useLocalStorageState from '../../state/localstorage-state'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import Tooltip from '@material-ui/core/Tooltip'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TableContainer from '@material-ui/core/TableContainer'
import Table from '@material-ui/core/Table'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import TableBody from '@material-ui/core/TableBody'

import AppHeader from '../../components/app-header'
import Alert from '@material-ui/lab/Alert'
import { makeStyles } from '@material-ui/core'
import { AlertTitle } from '@material-ui/lab'

interface IERC20 {
	address: Address
	balanceOf (account: string): Promise<BigNumber>
	decimals: () => Promise<number>
	allowance: (accountOwner: string, spender: string) => Promise<BigNumber>
	increaseAllowance: (address: string, amount: BigNumber.Value) => CeloTransactionObject<boolean>
}

type tokenF = (kit: ContractKit) => Promise<IERC20>

const decimals = 18
const stableTokens: {[token: string]: tokenF} = {
	"cUSD": (kit: ContractKit) => (kit.contracts.getStableToken()),
}

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
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			// TODO: handle multi-exchange once it is available.
			const exchange = await kit.contracts.getExchange()
			const goldToken = await kit.contracts.getGoldToken()
			const stableTokenC = await stableTokens[stableToken](kit)
			const oracles = await kit.contracts.getSortedOracles()

			const celoBalance = goldToken.balanceOf(account.address)
			const stableDecimals = stableTokenC.decimals()
			const stableBalance = stableTokenC.balanceOf(account.address)

			const spread = exchange.spread()
			const buckets = exchange.getBuyAndSellBuckets(true)

			// TODO: multi-currency handling.
			const oracleRate = oracles.medianRate(CeloContract.StableToken)

			if (await stableDecimals !== decimals) {
				throw new Error(`Unexpected decimals for ${stableToken}. Expected: ${decimals} Got: ${stableDecimals}`)
			}
			const [stableBucket, celoBucket] = await buckets
			return {
				celoBalance: await celoBalance,
				stableBalance: await stableBalance,
				spread: await spread,
				oracleRate: await oracleRate,
				celoBucket,
				stableBucket,
			}
		},
		[account, stableToken]
	))
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
				new BigNumber(celoAmount).shiftedBy(decimals),
				fetched.celoBucket, fetched.stableBucket, fetched.spread)
			setStableAmount(fmtTradeAmount(stableAmountN, side === "sell" ? BigNumber.ROUND_DOWN : BigNumber.ROUND_UP))
		} else {
			const celoAmountN = calcCeloAmount(
				side,
				new BigNumber(stableAmount).shiftedBy(decimals),
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
		oracleRate: MedianRate,
		spread: BigNumber,
	} | undefined>()

	const runTXs = (f: TXFunc) => {
		props.runTXs(f, (e?: Error) => {
			refetch()
			if (!e) {
				setCeloAmount("")
				setStableAmount("")
			}
		})
	}
	const stableNames = Object.keys(stableTokens)
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
			// TODO: support multi exchange.
			const exchange = await kit.contracts.getExchange()
			const txSwap = exchange.sell(sellAmount, minAmount, sellCELO)
			// Set explicit gas based on github.com/celo-org/celo-monorepo/issues/2541
			const txs: Transaction[] = [{tx: txSwap, params: {gas: 300000}}]

			const approveC = await (
				sellCELO ?
				kit.contracts.getGoldToken() :
				stableTokens[stableToken](kit))
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
		(side === "sell" && fetched.celoBalance.shiftedBy(-decimals).gt(celoAmount)) ||
		(side === "buy" && fetched.stableBalance.shiftedBy(-decimals).gt(stableAmount))
		)

	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader app={Mento} isFetching={isFetching} refetch={refetch} />
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
							<TextField
								margin="normal"
								label={
									(!fetched || side !== "sell") ? `CELO` :
									`CELO (max: ${fmtAmount(fetched.celoBalance, decimals)})`}
								InputLabelProps={{
									shrink: true,
								}}
								value={celoAmount}
								placeholder="0.0"
								size="medium"
								type="number"
								fullWidth={true}
								onChange={(e) => { handleChangeCeloAmt(e.target.value) }}
								disabled={!fetched}
							/>
							<TextField
								margin="normal"
								label={
									(!fetched || side !== "buy") ? `${stableToken}` :
									`${stableToken} (max: ${fmtAmount(fetched.stableBalance, decimals)})`}
								InputLabelProps={{
									shrink: true,
								}}
								value={stableAmount}
								placeholder="0.0"
								size="medium"
								type="number"
								fullWidth={true}
								onChange={(e) => { handleChangeStableAmt(e.target.value) }}
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
											oracleRate: fetched.oracleRate,
											spread: fetched.spread,
										})
									}}
									>Trade</Button>
							</Box>
						</Box>
					</Box>
				</Paper>
			</Box>
		</Box>
	)
}
export default MentoApp

const fmtTradeAmount = (n: BigNumber, roundingMode: BigNumber.RoundingMode) => {
	if (!n.gt(0)) {
		return ""
	} else {
		const v = n.shiftedBy(-decimals)
		const maxDP = 6
		let dp = maxDP
		for (; dp > 0; dp--) {
			if (v.gte(10 ** (dp - 1))) {
				break
			}
		}
		return v.decimalPlaces(maxDP - dp, roundingMode).toString()
	}
}

const calcCeloAmount = (
	side: "sell" | "buy",
	stableAmount: BigNumber,
	celoBucket: BigNumber,
	stableBucket: BigNumber,
	spread: BigNumber) => {
	return side === "sell" ?
		calcSellAmount(stableAmount, stableBucket, celoBucket, spread) :
		calcBuyAmount(stableAmount, stableBucket, celoBucket, spread)
}
const calcStableAmount = (
	side: "sell" | "buy",
	celoAmount: BigNumber,
	celoBucket: BigNumber,
	stableBucket: BigNumber,
	spread: BigNumber) => {
	return side === "sell" ?
		calcBuyAmount(celoAmount, celoBucket, stableBucket, spread) :
		calcSellAmount(celoAmount, celoBucket, stableBucket, spread)
}

const calcBuyAmount = (
	sellAmount: BigNumber,
	sellBucket: BigNumber,
	buyBucket: BigNumber,
	spread: BigNumber) => {
	// _getBuyTokenAmount from exchange.sol
	const reducedSellAmt = sellAmount.multipliedBy(new BigNumber(1).minus(spread))
	return reducedSellAmt.multipliedBy(buyBucket)
		.div(sellBucket.plus(reducedSellAmt))
}
const calcSellAmount = (
	buyAmount: BigNumber,
	buyBucket: BigNumber,
	sellBucket: BigNumber,
	spread: BigNumber) => {
	// _getSellTokenAmount from exchange.sol
	return buyAmount.multipliedBy(sellBucket)
		.div(buyBucket.minus(buyAmount).multipliedBy(new BigNumber(1).minus(spread)))
}

const useStyles = makeStyles(() => ({
	cell: {
		whiteSpace: "nowrap",
		fontStyle: "italic",
	}
}))

const ConfirmSwap = (props: {
	side: "sell" | "buy",
	celoAmount: string,
	stableToken: string,
	stableAmount: string,
	slippagePct: string,
	oracleRate: MedianRate,
	spread: BigNumber,
	onConfirmSell: (
		stableToken: string,
		sellCELO: boolean,
		sellAmount: BigNumber,
		minAmount: BigNumber) => void,
	onCancel: () => void,
}) => {
	const classes = useStyles()
	const handleConfirm = () => {
		const celoAmtN = new BigNumber(props.celoAmount).shiftedBy(decimals)
		const stableAmtN = new BigNumber(props.stableAmount).shiftedBy(decimals)
		const slippage = new BigNumber(1).minus(new BigNumber(props.slippagePct).div(100))
		const sellCELO = props.side === "sell"
		const sellAmount = (sellCELO ? celoAmtN : stableAmtN).integerValue(BigNumber.ROUND_DOWN)
		const minAmount = (sellCELO ? stableAmtN : celoAmtN).multipliedBy(slippage).integerValue(BigNumber.ROUND_DOWN)
		props.onConfirmSell(
			props.stableToken,
			sellCELO,
			sellAmount,
			minAmount,
		)
	}
	const estimatedPrice = new BigNumber(props.stableAmount).div(props.celoAmount)
	let priceImpact = props.oracleRate.rate.minus(estimatedPrice).div(props.oracleRate.rate)
	if (props.side === "buy") { priceImpact = priceImpact.negated() }
	priceImpact = priceImpact.minus(props.spread)
	const priceImpactTxt =
		priceImpact.lt(0.0001) ? "<0.01%" :
		priceImpact.multipliedBy(100).toFixed(2) + "%"
	const priceImpactSeverity =
		priceImpact.lte(0.005) ? "success" :
		priceImpact.lte(0.01) ? "warning" : "error"

	return (
		<Dialog open={true} onClose={props.onCancel} maxWidth="xs">
			<DialogContent>
				<Box display="flex" flexDirection="column">
					<TableContainer component={Paper}>
					<Table size="small">
						<TableBody>
							<TableRow>
								<TableCell className={classes.cell}>
									{props.side === "sell" ? "Sell" : "Buy"}
								</TableCell>
								<TableCell width="100%" align="right">{props.celoAmount} CELO</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className={classes.cell}>For</TableCell>
								<TableCell align="right">{props.stableAmount} {props.stableToken}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className={classes.cell}>Max slippage</TableCell>
								<TableCell align="right">{props.slippagePct}%</TableCell>
							</TableRow>
						</TableBody>
					</Table>
					</TableContainer>

					{priceImpactSeverity !== "success" &&
					<Box marginTop={1} alignSelf="flex-end">
						<Alert
							severity={priceImpactSeverity}>
							<AlertTitle>Price impact: {priceImpactTxt}</AlertTitle>
							The difference between market price and estimated price is significant
							due to the trade size. Consider making smaller trades with some delay
							in-between.
						</Alert>
					</Box>}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button color="primary" onClick={handleConfirm}>Trade</Button>
			</DialogActions>
		</Dialog>
	)
}