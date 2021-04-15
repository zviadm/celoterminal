import BigNumber from 'bignumber.js'
import { celoToSavings, savingsToCELO } from 'savingscelo'
import { maxLossFromPriceChange } from 'savingscelo-with-ube'

import { coreErc20Decimals } from '../../../lib/erc20/core'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	Box, Button, Typography, Tooltip,
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import HelpOutline from '@material-ui/icons/HelpOutline'

import NumberInput from '../../components/number-input'
import useLocalStorageState from '../../state/localstorage-state'
import Link from '../../components/link'
import { celoToSavingsWithMax } from './utils'

const LPOnUbe = (props: {
	balance_CELO: BigNumber,
	balance_sCELO: BigNumber,
	sCELOasCELO: BigNumber,
	ubeReserve_CELO: BigNumber,
	ubeReserve_sCELO: BigNumber,
	savingsTotal_CELO: BigNumber,
	savingsTotal_sCELO: BigNumber,
	onAddLiquidity: (
		toAdd_CELO: BigNumber,
		toAdd_sCELO: BigNumber,
		maxReserveRatio: BigNumber,
		cb: (e?: Error) => void) => void,
}): JSX.Element => {
	const [toAdd_sCELO, setToAdd_sCELO] = React.useState("")
	const [toAdd_CELO, setToAdd_CELO] = React.useState("")
	const reserveRatioOptions = ["1.01", "1.05", "1.10"]
	const [maxReserveRatio, setMaxReserveRatio] = useLocalStorageState(
		"terminal/savingscelo/lp-max-reserve-ratio", reserveRatioOptions[1])
	if (reserveRatioOptions.indexOf(maxReserveRatio) === -1) {
		setMaxReserveRatio(reserveRatioOptions[1])
	}

	const ubeReserve_sCELOasCELO = savingsToCELO(
		props.ubeReserve_sCELO, props.savingsTotal_sCELO, props.savingsTotal_CELO)
	const reserveRatio = BigNumber.maximum(
		props.ubeReserve_CELO.div(ubeReserve_sCELOasCELO),
		ubeReserve_sCELOasCELO.div(props.ubeReserve_CELO),
	)
	const maxLossPct = maxLossFromPriceChange(reserveRatio).multipliedBy(100)

	const minToAdd_CELO = celoToSavings(
		new BigNumber(toAdd_sCELO || 0).shiftedBy(coreErc20Decimals),
		props.savingsTotal_CELO,
		props.savingsTotal_sCELO)
		.multipliedBy(props.ubeReserve_CELO)
		.div(props.ubeReserve_sCELO)
		.shiftedBy(-coreErc20Decimals).decimalPlaces(2, BigNumber.ROUND_UP)
	const maxToAdd_sCELO = props.sCELOasCELO.shiftedBy(-coreErc20Decimals)
	const maxToAdd_CELO = props.balance_CELO.shiftedBy(-coreErc20Decimals)
	const canAdd = (toAdd_sCELO || toAdd_CELO) &&
		maxToAdd_sCELO.gte(toAdd_sCELO || 0) &&
		maxToAdd_CELO.gte(toAdd_CELO || 0) &&
		minToAdd_CELO.lte(toAdd_CELO || 0) &&
		reserveRatio.lte(maxReserveRatio)

	const handleAdd = () => {
		const _toAdd_CELO = new BigNumber(toAdd_CELO || 0).shiftedBy(coreErc20Decimals)
		const _toAdd_sCELO = celoToSavingsWithMax(
			new BigNumber(toAdd_sCELO || 0).shiftedBy(coreErc20Decimals),
			props.balance_sCELO,
			props.savingsTotal_CELO,
			props.savingsTotal_sCELO,
		)
		props.onAddLiquidity(
			_toAdd_CELO, _toAdd_sCELO, new BigNumber(maxReserveRatio),
			(e?: Error) => {
				if (!e) {
					setToAdd_CELO("")
					setToAdd_sCELO("")
				}
			})
	}
	return (
		<Box display="flex" flexDirection="column">
			<Alert severity="warning" style={{marginBottom: 10}}>
				Being a liquidity provider to Ubeswap is an advanced activity and it carries certain level of
				risk. Make sure to familiarize yourself with the Ubeswap/Uniswap details first to understand
				these risks. <Link href="https://uniswap.org/docs/v2/core-concepts/pools/">Learn more.</Link>
			</Alert>
			<NumberInput
				autoFocus
				margin="normal"
				id="add-scelo-input"
				label={`sCELO amount as CELO (max: ${fmtAmount(props.sCELOasCELO, "CELO")})`}
				InputLabelProps={{shrink: true}}
				value={toAdd_sCELO}
				onChangeValue={setToAdd_sCELO}
				maxValue={maxToAdd_sCELO}
			/>
			<NumberInput
				autoFocus
				margin="normal"
				id="add-scelo-input"
				label={`CELO amount ` +
					`(min: ${fmtAmount(minToAdd_CELO.shiftedBy(coreErc20Decimals), "CELO")}, ` +
					`max: ${fmtAmount(props.balance_CELO, "CELO")})`}
				InputLabelProps={{shrink: true}}
				value={toAdd_CELO}
				onChangeValue={setToAdd_CELO}
				maxValue={maxToAdd_CELO}
			/>
			{reserveRatio.gt(maxReserveRatio) &&
			<Alert severity="error">
				Ubeswap CELO+sCELO pool is out of balance. Adding liquidity now can lead to large levels
				of losses due to future price changes. It is strongly recommended to avoid supplying
				liquidity until pool becomes more balanced. <br /><br />
				Expected future &quot;Impermanent Loss&quot; {maxLossPct.toFixed(3)}%.
			</Alert>}
			<Box
				display="flex"
				flexDirection="row"
				alignItems="flex-end"
				justifyContent="space-between"
				marginTop={1}>
				<Box display="flex" flexDirection="column" alignItems="flex-end">
					<Box display="flex" flexDirection="column">
						<Typography variant="caption">
							Max &quot;Impermanent Loss&quot;
							<Tooltip title="Maximum amount of loss you might incur due to future price changes.">
								<HelpOutline style={{fontSize: 12}}/>
							</Tooltip>
						</Typography>
						<Box display="flex" flexDirection="row">
							{
							reserveRatioOptions.map((o) => (
								<Button
									key={`max-ratio-${o}`}
									variant={o === maxReserveRatio ? "outlined" : "text"}
									onClick={() => { setMaxReserveRatio(o) }}
									>{maxLossFromPriceChange(o).multipliedBy(100).toFixed(3)}%</Button>
							))
							}
						</Box>
					</Box>
				</Box>
				<Box display="flex" flexDirection="column" width={200}>
					<Button
						id="add-liquidity"
						color="primary"
						variant="outlined"
						disabled={!canAdd}
						onClick={handleAdd}>Supply Liquidity</Button>
				</Box>
			</Box>
		</Box>
	)
}
export default LPOnUbe
