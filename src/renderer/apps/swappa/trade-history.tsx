import { TradeEvent } from './state'
import { erc20FromAddress, fmtAddress, fmtAmount } from '../../../lib/utils'
import { explorerRootURL } from '../../../lib/cfg'
import { RegisteredErc20 } from '../../../lib/erc20/core'

import * as React from 'react'
import {
	LinearProgress, Table, TableBody,
	TableHead, TableRow, TableCell, Tooltip
} from '@material-ui/core'

import Link from '../../components/link'
import SectionTitle from '../../components/section-title'
import { fmtTradeAmount } from './utils'

const TradeHistory = (props: {
	events?: TradeEvent[],
	extraErc20s: RegisteredErc20[],
}): JSX.Element => {

	const events = props.events
	return (<>
		<SectionTitle>Recent Trades</SectionTitle>
		{!events ? <LinearProgress /> :
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>Date</TableCell>
					<TableCell width="100%">From</TableCell>
					<TableCell width="100%">To</TableCell>
					<TableCell>Out/In</TableCell>
					<TableCell>TXHash</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
			{
				events.map((e) => {
					const input = erc20FromAddress(e.input, props.extraErc20s)
					const inputDecimals = input?.decimals || 0
					const output = erc20FromAddress(e.output, props.extraErc20s)
					const outputDecimals = output?.decimals || 0
					return (
						<TableRow key={e.txHash}>
							<Tooltip title={e.timestamp.toLocaleString()}>
							<TableCell>{e.timestamp.toLocaleDateString()}</TableCell>
							</Tooltip>
							<TableCell style={{whiteSpace: "nowrap"}}>
								{fmtTradeAmount(e.inputAmount, inputDecimals)} {input?.symbol}
							</TableCell>
							<TableCell style={{whiteSpace: "nowrap"}}>
								{fmtTradeAmount(e.outputAmount, outputDecimals)} {output?.symbol}
							</TableCell>
							<TableCell style={{whiteSpace: "nowrap"}}>
								{fmtAmount(e.outputAmount.shiftedBy(-outputDecimals).div(e.inputAmount.shiftedBy(-inputDecimals)), 0, 4)}
							</TableCell>
							<TableCell>
								<Link href={`${explorerRootURL()}/tx/${e.txHash}`} style={{fontFamily: "monospace"}}>
									{fmtAddress(e.txHash)}
								</Link>
							</TableCell>
						</TableRow>
					)
				})
			}
			</TableBody>
		</Table>}
	</>)
}
export default TradeHistory