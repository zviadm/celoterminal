import BigNumber from 'bignumber.js'
import { coreErc20Decimals } from '../../../lib/erc20/core'

import * as React from 'react'
import {
	makeStyles, Dialog, DialogContent, DialogActions,
	TableContainer, Table, TableRow, TableCell, TableBody,
	Box, Button, Paper,
} from '@material-ui/core'
import { Alert, AlertTitle } from '@material-ui/lab'

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
	marketPrice: BigNumber,
	spread: BigNumber,
	onConfirmSell: (
		stableToken: string,
		sellCELO: boolean,
		sellAmount: BigNumber,
		minAmount: BigNumber) => void,
	onCancel: () => void,
}): JSX.Element => {
	const classes = useStyles()
	const handleConfirm = () => {
		const celoAmtN = new BigNumber(props.celoAmount).shiftedBy(coreErc20Decimals)
		const stableAmtN = new BigNumber(props.stableAmount).shiftedBy(coreErc20Decimals)
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
	let priceImpact = props.marketPrice.minus(estimatedPrice).div(props.marketPrice)
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
								<TableCell className={classes.cell}>Price</TableCell>
								<TableCell align="right">{estimatedPrice.toFixed(4)}</TableCell>
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
export default ConfirmSwap