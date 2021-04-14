import BigNumber from 'bignumber.js'

import { coreErc20Decimals } from '../../../lib/erc20/core'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	Box, Button, Table, TableBody, TableRow, TableCell,
} from '@material-ui/core'

import NumberInput from '../../components/number-input'
import { ubeGetAmountOut } from './utils'
import { celoToSavings } from 'savingscelo'
import Alert from '@material-ui/lab/Alert'

const SellOnUbe = (props: {
	sCELOasCELO: BigNumber,
	ubeReserve_CELO: BigNumber,
	ubeReserve_sCELO: BigNumber,
	savingsTotal_CELO: BigNumber,
	savingsTotal_sCELO: BigNumber,
}): JSX.Element => {
	const [toSell, setToSell] = React.useState("")
	const maxToSell = props.sCELOasCELO.shiftedBy(-coreErc20Decimals)
	const canSell = false

	const sell_CELO = new BigNumber(toSell || 0).shiftedBy(coreErc20Decimals)
	const sell_sCELO = celoToSavings(
		sell_CELO, props.savingsTotal_CELO, props.savingsTotal_sCELO)
	const receive_CELO = ubeGetAmountOut(
		sell_sCELO, props.ubeReserve_sCELO, props.ubeReserve_CELO)
	const sellImpact = sell_CELO.eq(0) ? new BigNumber(0) : receive_CELO.minus(sell_CELO).div(sell_CELO)

	return (
		<Box display="flex" flexDirection="column">
			<Alert severity="info" style={{marginBottom: 10}}>
				If you do not want to wait for the unlocking period and want to immediatelly convert
				your sCELO back to CELO, you can sell it on Ubeswap.
			</Alert>
			<Alert severity="warning" style={{marginBottom: 10}}>
				When you sell your sCELO on Ubeswap, you will most likely have to take a loss due to
				the market price and also due to the Ubeswap trading fees.
			</Alert>
			<NumberInput
				autoFocus
				margin="dense"
				variant="outlined"
				id="sell-celo-input"
				label={`Sell (max: ${fmtAmount(props.sCELOasCELO, "CELO")})`}
				InputLabelProps={{shrink: true}}
				value={toSell}
				onChangeValue={setToSell}
				maxValue={maxToSell}
			/>
			<Table>
				<TableBody>
					<TableRow>
						<TableCell width="100%">Loss compared to WITHDRAW</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}}>
							Maximum: {sellImpact.multipliedBy(100).toFixed(2)}%
						</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}}>
							Expected: {sellImpact.multipliedBy(100).toFixed(2)}%
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Receive</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}}>
							Minimum: {fmtAmount(receive_CELO, "CELO")} CELO
						</TableCell>
						<TableCell style={{whiteSpace: "nowrap"}}>
							Expected: {fmtAmount(receive_CELO, "CELO")} CELO
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
			{sellImpact.lt(-0.01) &&
			<Alert severity="error" style={{marginTop: 10, marginBottom: 10}}>
				If you sell your sCELO right now instead of going through the withdraw flow, you
				will lose {sellImpact.negated().multipliedBy(100).toFixed(2)}% of your value!
			</Alert>}
			<Button
				id="sell"
				color="primary"
				variant="outlined"
				disabled={!canSell}
				onClick={undefined}>Sell</Button>
		</Box>
	)
}
export default SellOnUbe
