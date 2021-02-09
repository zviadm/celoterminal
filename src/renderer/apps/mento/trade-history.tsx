import { TradeEvent } from './state'
import { Decimals } from './config'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import Box from '@material-ui/core/Box'
import { LinearProgress, ListItemText, Typography, ListItem, List } from '@material-ui/core'

const TradeHistory = (props: {
	events?: TradeEvent[],
}): JSX.Element => {

	const events = props.events
	return (
		<Box>
			<Typography>Recent Events</Typography>
			{!events ? <LinearProgress /> : <>
			<Box display="flex" flex={1} overflow="auto" height="100vh">
				<List>
				{
					events.map((e) => {
						return (
							<ListItem key={e.txHash}>
								<ListItemText>
									{`${fmtAmount(e.sellAmount, Decimals)} -> ${fmtAmount(e.buyAmount, Decimals)}`}
								</ListItemText>
							</ListItem>
						)
					})
				}
				</List>
			</Box>
			</>}
		</Box>
	)
}
export default TradeHistory