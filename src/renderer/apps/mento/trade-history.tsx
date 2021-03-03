import { TradeEvent } from './state'
import { fmtAddress, fmtAmount } from '../../../lib/utils'
import { explorerRootURL } from '../../../lib/cfg'
import { coreErc20Decimals } from '../../../lib/erc20/core'

import * as React from 'react'
import Box from '@material-ui/core/Box'
import {
	LinearProgress, Typography, Table, TableBody,
	TableHead, TableRow, TableCell, Tooltip
} from '@material-ui/core'

import Link from '../../components/link'

const TradeHistory = (props: {
	events?: TradeEvent[],
}): JSX.Element => {

	const events = props.events
	const explorerURL = explorerRootURL()
	return (<>
		<Typography variant="h6" color="textSecondary">Recent Trades</Typography>
		{!events ? <LinearProgress /> : <>
		<Box display="flex" flex={1} overflow="auto" height="100vh">
			<Table size="small">
				<TableHead>
					<TableRow>
						<TableCell>Date</TableCell>
						<TableCell width="100%">Trade</TableCell>
						<TableCell>Price</TableCell>
						<TableCell>TXHash</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
				{
					events.map((e) => {
						return (
							<TableRow key={e.txHash}>
								<Tooltip title={e.timestamp.toLocaleString()}>
								<TableCell>{e.timestamp.toLocaleDateString()}</TableCell>
								</Tooltip>
								<TableCell style={{
									whiteSpace: "nowrap",
									color: e.soldGold ? "#f44336" : "#4caf50"}}>
									{e.soldGold ?
									`${fmtAmount(e.buyAmount, coreErc20Decimals)} cUSD \u2190 ${fmtAmount(e.sellAmount, coreErc20Decimals)} CELO` :
									`${fmtAmount(e.sellAmount, coreErc20Decimals)} cUSD \u2192 ${fmtAmount(e.buyAmount, coreErc20Decimals)} CELO`
									}
								</TableCell>
								<TableCell align="right">
									{e.soldGold ?
									e.buyAmount.div(e.sellAmount).toFixed(4) :
									e.sellAmount.div(e.buyAmount).toFixed(4)
									}
								</TableCell>
								<TableCell>
									<Link href={`${explorerURL}/tx/${e.txHash}`} style={{fontFamily: "monospace"}}>
										{fmtAddress(e.txHash)}
									</Link>
								</TableCell>
							</TableRow>
						)
					})
				}
				</TableBody>
			</Table>
		</Box>
		</>}
	</>)
}
export default TradeHistory