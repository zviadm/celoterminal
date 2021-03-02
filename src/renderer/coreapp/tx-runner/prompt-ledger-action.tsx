import * as React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import AccountIcon from '../accounts-app/account-icon'

const useStyles = makeStyles(() => ({
	text: {
		fontStyle: "italic",
	},
	"@keyframes blinker": {
		from: {opacity: 1},
		to: {opacity: 0}
	},
	icon: {
		animationName: "$blinker",
		animationDuration: '1s',
		animationTimingFunction: 'linear',
		animationIterationCount:'infinite',
	},
}))

const PromptLedgerAction = (props: {text: string}): JSX.Element => {
	const classes = useStyles()
	return (
		<Box display="flex" flexDirection="row">
			<Typography className={classes.text} color="textSecondary">
				{props.text}
			</Typography>
			<AccountIcon type="ledger" className={classes.icon} />
		</Box>
	)
}
export default PromptLedgerAction