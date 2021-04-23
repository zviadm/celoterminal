import BigNumber from 'bignumber.js'
import { celoToSavings } from 'savingscelo'
import { maxLossFromPriceChange } from 'savingscelo-with-ube'

import { coreErc20Decimals } from '../../../lib/erc20/core'
import { fmtAmount } from '../../../lib/utils'
import { celoToSavingsWithMax } from './utils'
import useLocalStorageState from '../../state/localstorage-state'

import * as React from 'react'
import {
	Box, Button, Typography, Tooltip,
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import HelpOutline from '@material-ui/icons/HelpOutline'

import NumberInput from '../../components/number-input'
import Link from '../../components/link'

const LPOnUbe = (props: {
	balance_CELO: BigNumber,
	balance_sCELO: BigNumber,
	sCELOasCELO: BigNumber,
	ubeReserve_CELO: BigNumber,
	ubeReserve_sCELO: BigNumber,
	savingsTotal_CELO: BigNumber,
	savingsTotal_sCELO: BigNumber,
	ubeswapPoolURL: string,
	ubeswapFarmURL: string,
	onAddLiquidity: (
		toAdd_CELO: BigNumber,
		toAdd_sCELO: BigNumber,
		maxReserveRatio: BigNumber,
		cb: (e?: Error) => void) => void,
}): JSX.Element => {
	const [toAdd_sCELO_as_CELO, setToAdd_sCELO_as_CELO] = React.useState("")
	const [toAdd_CELO, setToAdd_CELO] = React.useState("")
	const reserveRatioOptions = ["1.01", "1.05", "1.10"]
	const [maxReserveRatio, setMaxReserveRatio] = useLocalStorageState(
		"terminal/savingscelo/lp-max-reserve-ratio", reserveRatioOptions[1])
	if (reserveRatioOptions.indexOf(maxReserveRatio) === -1) {
		setMaxReserveRatio(reserveRatioOptions[1])
	}

	const ubeReserve_CELO_as_sCELO = celoToSavings(
		props.ubeReserve_CELO, props.savingsTotal_CELO, props.savingsTotal_sCELO)
	const reserveRatio = (props.ubeReserve_CELO.eq(0) && props.ubeReserve_sCELO.eq(0)) ?
		new BigNumber(1) : BigNumber.maximum(
			props.ubeReserve_sCELO.div(ubeReserve_CELO_as_sCELO),
			ubeReserve_CELO_as_sCELO.div(props.ubeReserve_sCELO),
		)
	const maxLossPct = maxLossFromPriceChange(reserveRatio).multipliedBy(100)

	const minToAdd_CELO = ((props.ubeReserve_CELO.eq(0) && props.ubeReserve_sCELO.eq(0)) ?
		new BigNumber(toAdd_sCELO_as_CELO || 0).shiftedBy(coreErc20Decimals) :
		celoToSavings(
			new BigNumber(toAdd_sCELO_as_CELO || 0).shiftedBy(coreErc20Decimals),
			props.savingsTotal_CELO,
			props.savingsTotal_sCELO)
			.multipliedBy(props.ubeReserve_CELO)
			.div(props.ubeReserve_sCELO)
		).shiftedBy(-coreErc20Decimals).decimalPlaces(2, BigNumber.ROUND_UP)

	const maxToAdd_sCELO = props.sCELOasCELO.shiftedBy(-coreErc20Decimals)
	const maxToAdd_CELO = BigNumber.maximum(
		props.balance_CELO.shiftedBy(-coreErc20Decimals).minus(0.001), 0)
	const canAdd = (toAdd_sCELO_as_CELO || toAdd_CELO) &&
		maxToAdd_sCELO.gte(toAdd_sCELO_as_CELO || 0) &&
		maxToAdd_CELO.gte(toAdd_CELO || 0) &&
		minToAdd_CELO.lte(toAdd_CELO || 0) &&
		reserveRatio.lte(maxReserveRatio)

	const handleAdd = () => {
		const _toAdd_CELO = new BigNumber(toAdd_CELO || 0).shiftedBy(coreErc20Decimals)
		const _toAdd_sCELO = celoToSavingsWithMax(
			new BigNumber(toAdd_sCELO_as_CELO || 0).shiftedBy(coreErc20Decimals),
			props.balance_sCELO,
			props.savingsTotal_CELO,
			props.savingsTotal_sCELO,
		)
		props.onAddLiquidity(
			_toAdd_CELO, _toAdd_sCELO, new BigNumber(maxReserveRatio),
			(e?: Error) => {
				if (!e) {
					setToAdd_CELO("")
					setToAdd_sCELO_as_CELO("")
				}
			})
	}
	return (
		<Box display="flex" flexDirection="column">
			<Alert severity="info" style={{marginBottom: 10}}>
				<Link href={props.ubeswapPoolURL}>Ubeswap CELO+sCELO Pool</Link>
			</Alert>
			<Alert severity="info" style={{marginBottom: 10}}>
				<Link href={props.ubeswapFarmURL}>Ubeswap CELO+sCELO Farm</Link>
			</Alert>
			<Alert severity="warning" style={{marginBottom: 10}}>
				Being a liquidity provider to Ubeswap is an advanced activity and it carries certain level of
				risk. Make sure to familiarize yourself with the Ubeswap/Uniswap details first to understand
				these risks. <Link href="https://docs.savingscelo.com/savingscelo-x-ubeswap/overview">Learn more.</Link>
			</Alert>
			<NumberInput
				autoFocus
				margin="normal"
				id="add-scelo-input"
				label={`sCELO amount as CELO (max: ${fmtAmount(props.sCELOasCELO, "CELO")})`}
				InputLabelProps={{shrink: true}}
				value={toAdd_sCELO_as_CELO}
				onChangeValue={setToAdd_sCELO_as_CELO}
				maxValue={maxToAdd_sCELO}
			/>
			<NumberInput
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
				Expected future &quot;Divergence Loss&quot; {maxLossPct.toFixed(3)}%.
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
							Max &quot;Divergence Loss&quot;
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
