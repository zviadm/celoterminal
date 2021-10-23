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

const TradeHistory = (props: {
	events?: TradeEvent[],
	extraErc20s: RegisteredErc20[],
}): JSX.Element => {

	const events = props.events
	const explorerURL = explorerRootURL()
	return (<>
		<SectionTitle>Recent Trades</SectionTitle>
		{!events ? <LinearProgress /> :
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>Date</TableCell>
					<TableCell width="100%">From</TableCell>
					<TableCell width="100%">To</TableCell>
					<TableCell>Price</TableCell>
					<TableCell>TXHash</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
			{
				events.map((e) => {
					const input = erc20FromAddress(e.input, props.extraErc20s)
					const output = erc20FromAddress(e.output, props.extraErc20s)
					return (
						<TableRow key={e.txHash}>
							<Tooltip title={e.timestamp.toLocaleString()}>
							<TableCell>{e.timestamp.toLocaleDateString()}</TableCell>
							</Tooltip>
							<TableCell style={{whiteSpace: "nowrap"}}>
								{fmtAmount(e.inputAmount, input?.decimals || 0)} {input?.symbol}
							</TableCell>
							<TableCell style={{whiteSpace: "nowrap"}}>
								{fmtAmount(e.outputAmount, output?.decimals || 0)} {output?.symbol}
							</TableCell>
							<TableCell style={{whiteSpace: "nowrap"}}>
								{fmtAmount(e.outputAmount.div(e.inputAmount), 0, 4)}
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
		</Table>}
	</>)
}
export default TradeHistory