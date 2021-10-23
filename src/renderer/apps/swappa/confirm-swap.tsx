import BigNumber from 'bignumber.js'
import { Route } from '@terminal-fi/swappa'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { fmtTradeAmount } from './utils'
import { erc20FromAddress, fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	makeStyles, Dialog, DialogContent, DialogActions,
	TableContainer, Table, TableRow, TableCell, TableBody,
	Box, Button, Paper,
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import AlertTitle from '@material-ui/lab/AlertTitle'

const useStyles = makeStyles(() => ({
	cell: {
		whiteSpace: "nowrap",
		fontStyle: "italic",
	}
}))

const ConfirmSwap = (props: {
	route: Route,
	inputAmount: string,
	slippagePct: string,
	extraErc20s: RegisteredErc20[],
	onConfirmSwap: (
		route: Route,
		inputAmount: BigNumber,
		minOutputAmount: BigNumber) => void,
	onCancel: () => void,
}): JSX.Element => {
	const classes = useStyles()
	const path = props.route.path.map((p) => erc20FromAddress(p, props.extraErc20s))
	const inputToken = path[0]
	const outputToken = path[path.length - 1]
	const inputAmount = new BigNumber(props.inputAmount).shiftedBy(inputToken?.decimals || 0)
	const handleConfirm = () => {
		if (!inputToken) {
			throw new Error(`Unknown input token: ${props.route.path[0]}`)
		}
		if (!outputToken) {
			throw new Error(`Unknown input token: ${props.route.path[props.route.path.length - 1]}`)
		}
		const slippage = new BigNumber(1).minus(new BigNumber(props.slippagePct).div(100))
		const minOutputAmount = new BigNumber(props.route.outputAmount)
			.multipliedBy(slippage)
			.integerValue(BigNumber.ROUND_DOWN)
		props.onConfirmSwap(props.route, inputAmount, minOutputAmount)
	}
	const estimatedPrice = new BigNumber(props.route.outputAmount).div(inputAmount)
	const marketPrice = estimatedPrice
	const priceImpact = marketPrice.minus(estimatedPrice).div(marketPrice)
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
								<TableCell className={classes.cell}>Swap</TableCell>
								<TableCell width="100%" align="right">{props.inputAmount} {inputToken?.symbol}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className={classes.cell}>For</TableCell>
								<TableCell align="right">
									{fmtTradeAmount(
										props.route.outputAmount, outputToken?.decimals || 0, BigNumber.ROUND_DOWN)} {outputToken?.symbol}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className={classes.cell}>Price</TableCell>
								<TableCell align="right">{fmtAmount(estimatedPrice, 0, 4)}</TableCell>
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
				<Button
					id="confirm-trade"
					color="primary" onClick={handleConfirm}>Trade</Button>
			</DialogActions>
		</Dialog>
	)
}
export default ConfirmSwap
