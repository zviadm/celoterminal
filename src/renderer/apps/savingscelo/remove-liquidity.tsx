import BigNumber from 'bignumber.js'
import { savingsToCELO } from 'savingscelo'

import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	Button, Table, TableBody, TableCell, TableRow, Typography,
} from '@material-ui/core'

import NumberInput from '../../components/number-input'
import SectionTitle from '../../components/section-title'

const RemoveLiquidity = (props: {
	balance_ULP: BigNumber,
	total_ULP: BigNumber,
	ubeReserve_CELO: BigNumber,
	ubeReserve_sCELO: BigNumber,
	savingsTotal_CELO: BigNumber,
	savingsTotal_sCELO: BigNumber,
	onRemoveLiquidity: (
		toRemove_ULP: BigNumber,
		min_CELO: BigNumber,
		min_sCELO: BigNumber,
		cb: (e?: Error) => void) => void,
}): JSX.Element => {
	const [toRemove, setToRemove] = React.useState("")


	const maxToRemove = props.balance_ULP.shiftedBy(-18)
	const canRemove = maxToRemove.gte(toRemove)

	const toRemove_ULP = new BigNumber(toRemove).shiftedBy(18)
	const expect_CELO = toRemove_ULP
		.multipliedBy(props.ubeReserve_CELO)
		.div(props.total_ULP).integerValue()
	const expect_sCELO = toRemove_ULP
		.multipliedBy(props.ubeReserve_sCELO)
		.div(props.total_ULP).integerValue()
	const expect_sCELO_as_CELO = savingsToCELO(
		expect_sCELO, props.savingsTotal_sCELO, props.savingsTotal_CELO)

	const handleRemove = () => {
		props.onRemoveLiquidity(
			toRemove_ULP,
			expect_CELO.multipliedBy(0.99).integerValue(),
			expect_sCELO.multipliedBy(0.99).integerValue(),
			(e?: Error) => { if (!e) { setToRemove("") } })
	}
	return (<>
		<SectionTitle>Remove Liquidity</SectionTitle>
		<NumberInput
			margin="normal"
			id="remove-liquidity-input"
			label={`Remove (max: ${fmtAmount(props.balance_ULP, 18)} ULP)`}
			InputLabelProps={{shrink: true}}
			value={toRemove}
			onChangeValue={setToRemove}
			maxValue={maxToRemove}
		/>
		{toRemove &&
		<Table size="small" style={{marginTop: 10, marginBottom: 10}}>
			<TableBody>
				<TableRow>
					<TableCell>Receive as CELO</TableCell>
					<TableCell>~{fmtAmount(expect_CELO, "CELO")} CELO</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>Receive as sCELO</TableCell>
					<TableCell>
						~{fmtAmount(expect_sCELO_as_CELO, "CELO")} CELO&nbsp;
						<Typography color="textSecondary" component="span">
							(= {fmtAmount(expect_sCELO, 18)} sCELO)
						</Typography>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>}
		<Button
			id="add-liquidity"
			color="primary"
			variant="outlined"
			disabled={!canRemove}
			onClick={handleRemove}>Remove Liquidity</Button>
	</>)
}
export default RemoveLiquidity
