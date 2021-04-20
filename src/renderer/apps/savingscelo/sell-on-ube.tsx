import BigNumber from 'bignumber.js'
import { celoToSavings } from 'savingscelo'

import { coreErc20Decimals } from '../../../lib/erc20/core'
import { fmtAmount } from '../../../lib/utils'
import useLocalStorageState from '../../state/localstorage-state'
import { celoToSavingsWithMax, ubeGetAmountOut } from './utils'

import * as React from 'react'
import {
	Box, Button, Table, TableBody, TableRow, TableCell, Typography, Tooltip,
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import HelpOutline from '@material-ui/icons/HelpOutline'

import NumberInput from '../../components/number-input'
import Link from '../../components/link'

const SellOnUbe = (props: {
	balance_sCELO: BigNumber,
	sCELOasCELO: BigNumber,
	ubeReserve_CELO: BigNumber,
	ubeReserve_sCELO: BigNumber,
	savingsTotal_CELO: BigNumber,
	savingsTotal_sCELO: BigNumber,
	ubeswapPoolURL: string,
	onSell: (
		toSell_CELO: BigNumber,
		receiveMin_CELO: BigNumber,
		cb: (e?: Error) => void) => void,
}): JSX.Element => {
	const [toSell, setToSell] = React.useState("")
	const slippageOptions = ["0.1", "0.5", "1.0"]
	const [slippagePct, setSlippagePct] = useLocalStorageState("terminal/savingscelo/sell-max-slippage", slippageOptions[1])
	if (slippageOptions.indexOf(slippagePct) === -1) {
		setSlippagePct(slippageOptions[1])
	}

	const sell_CELO = new BigNumber(toSell || 0).shiftedBy(coreErc20Decimals)
	const sell_sCELO = celoToSavings(
		sell_CELO, props.savingsTotal_CELO, props.savingsTotal_sCELO)
	const receive_CELO = ubeGetAmountOut(
		sell_sCELO, props.ubeReserve_sCELO, props.ubeReserve_CELO)
	const receiveMin_CELO = receive_CELO
		.multipliedBy(new BigNumber(100).minus(slippagePct).div(100))
		.integerValue(BigNumber.ROUND_DOWN)
	const sellImpact = sell_CELO.eq(0) ? new BigNumber(0) : receive_CELO.minus(sell_CELO).div(sell_CELO)
	const sellImpactMax = sell_CELO.eq(0) ? new BigNumber(0) : receiveMin_CELO.minus(sell_CELO).div(sell_CELO)

	const maxToSell = props.sCELOasCELO.shiftedBy(-coreErc20Decimals)
	const canSell = toSell && maxToSell.gte(toSell) && receive_CELO.gt(0)

	const handleSell = () => {
		const toSell_sCELO = celoToSavingsWithMax(
			new BigNumber(toSell).shiftedBy(coreErc20Decimals),
			props.balance_sCELO,
			props.savingsTotal_CELO,
			props.savingsTotal_sCELO,
		)
		props.onSell(
			toSell_sCELO, receiveMin_CELO,
			(e?: Error) => { if (!e) { setToSell("") } })
	}
	return (
		<Box display="flex" flexDirection="column">
			<Alert severity="info" style={{marginBottom: 10}}>
				<Link href={props.ubeswapPoolURL}>Ubeswap CELO+sCELO Pool</Link>
			</Alert>
			<Alert severity="info" style={{marginBottom: 10}}>
				You can sell your sCELO on the Ubeswap exchange if you do not want to wait for the
				unlocking period of the withdraw flow.
			</Alert>
			<Alert severity="warning" style={{marginBottom: 10}}>
				When you sell your sCELO on Ubeswap, you will most likely have to take a loss due to
				the market price and also due to the Ubeswap trading fees.
			</Alert>
			<NumberInput
				autoFocus
				margin="normal"
				id="sell-celo-input"
				label={`Sell (max: ${fmtAmount(props.sCELOasCELO, "CELO")})`}
				InputLabelProps={{shrink: true}}
				value={toSell}
				onChangeValue={setToSell}
				maxValue={maxToSell}
			/>
			<Box display="flex" flexDirection="column" marginTop={1} marginBottom={1}>
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
			<Table size="small" style={{marginBottom: 10}}>
				<TableBody>
					<TableRow>
						<TableCell>{sellImpact.lte(0) ? "Loss" : "Gain"} compared to WITHDRAW</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}}>
							Maximum: {sellImpactMax.multipliedBy(100).toFixed(2)}%
						</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}}>
							Expected: {sellImpact.multipliedBy(100).toFixed(2)}%
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Receive</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}}>
							Minimum: {fmtAmount(receiveMin_CELO, "CELO")} CELO
						</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}}>
							Expected: {fmtAmount(receive_CELO, "CELO")} CELO
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
			{sellImpact.lt(-0.01) &&
			<Alert severity="error" style={{marginTop: 10, marginBottom: 10}}>
				If you sell your sCELO right now, instead of going through the withdraw flow, you
				will lose {sellImpact.negated().multipliedBy(100).toFixed(2)}% of your value!
			</Alert>}
			<Button
				id="sell"
				color="primary"
				variant="outlined"
				disabled={!canSell}
				onClick={handleSell}>Sell</Button>
		</Box>
	)
}
export default SellOnUbe
