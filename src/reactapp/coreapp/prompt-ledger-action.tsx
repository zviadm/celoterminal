import * as React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles(() => ({
	root: {
		display: "flex",
		flexDirection: "row",
	},
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
		<div className={classes.root}>
			<Typography className={classes.text} color="textSecondary">
				{props.text}
			</Typography>
			<AccountBalanceWalletIcon className={classes.icon} />
		</div>
	)
}
export default PromptLedgerAction