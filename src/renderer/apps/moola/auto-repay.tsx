import * as React from 'react'
import { Box, Select, Button, MenuItem, InputLabel } from '@material-ui/core'
import { ContractKit, StableToken } from '@celo/contractkit'
import Alert from '@material-ui/lab/Alert'
import { stableTokens, moolaTokens } from './config'
import useLocalStorageState from '../../state/localstorage-state'
import NumberInput from '../../components/number-input'
import { fmtAmount } from '../../../lib/utils'
import BigNumber from 'bignumber.js'
import { coreErc20Decimals, Erc20InfiniteAmount } from '../../../lib/erc20/core'
import { toBigNumberWei } from './moola-helper'
import SectionTitle from '../../components/section-title'

const AutoRepay = (
	props: {
		onSetAutoRepay: (minHealthFactor: BigNumber, maxHealthFactor: BigNumber) => void,
	}
): JSX.Element => {

	const [minHealthFactor, setMinHealthFactor] = React.useState("")
	const [maxHealthFactor, setMaxHealthFactor] = React.useState("")

	return (
		<Box display="flex" flexDirection="column">
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<Box style={{ width: '45%' }}>
					<InputLabel>Min health factor</InputLabel>
				<NumberInput
					id="min-health-factor"
					margin="normal"
					value={minHealthFactor}
					placeholder="0.0"
					onChangeValue={setMinHealthFactor}
					
					/>
				</Box>
				<Box style={{ width: '45%' }}>
					<InputLabel>Max health factor</InputLabel>
				<NumberInput
					id="max-health-factor"
					margin="normal"
					value={maxHealthFactor}
					placeholder="0.0"
					onChangeValue={setMaxHealthFactor}
					
					/>
					</Box>
			</div>
			<div style={{ textAlign: "right"}}>
				<Button
					style={{ textTransform: "none", width: 150, marginTop: 30}}
					variant="contained"
					color="primary"
					onClick={() => props.onSetAutoRepay(toBigNumberWei(minHealthFactor), toBigNumberWei(maxHealthFactor))}
					>
					Submit
				</Button>
			</div>
		</Box>
	)
}

export default AutoRepay