import * as React from 'react'
import { Box } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

const Deposit = (): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<Alert severity="warning" style={{marginBottom: 10}}>
				Critical vulnerability was discovered within SavingsCELO protocol, thus all deposit
				functionality is turned off.
			</Alert>
			<Alert severity="error" style={{marginBottom: 10}}>
				WITHDRAW ALL YOUR FUNDS FROM SavingsCELO AS SOON AS POSSIBLE!
			</Alert>
		</Box>
	)
}
export default Deposit