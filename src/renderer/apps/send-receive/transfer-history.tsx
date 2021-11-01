import BigNumber from 'bignumber.js'
import { fmtAddress, fmtAmount } from '../../../lib/utils'
import { explorerRootURL } from '../../../lib/cfg'

import * as React from 'react'
import {
	LinearProgress, Table, TableBody,
	TableHead, TableRow, TableCell, Tooltip
} from '@material-ui/core'

import Link from '../../components/link'
import SectionTitle from '../../components/section-title'

const TransferHistory = (props: {
	address: string,
	erc20: {
		symbol: string,
		decimals: number,
	}
	events?: {
		timestamp: Date,
		txHash: string,
		from: string,
		to: string,
		amount: BigNumber,
	}[],
}): JSX.Element => {

	const events = props.events
	const erc20 = props.erc20
	const explorerURL = explorerRootURL()
	return (<>
		<SectionTitle>Recent Transfers</SectionTitle>
		{!events ? <LinearProgress /> :
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>Date</TableCell>
					<TableCell width="100%">Transfer</TableCell>
					<TableCell style={{whiteSpace: "nowrap"}} align="right">Amount</TableCell>
					<TableCell>TXHash</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
			{
				events &&
				events.map((e, idx) => {
					const addr = e.from === props.address ? e.to : e.from
					return (
						<TableRow key={`tx-${idx}-${e.txHash}`}>
							<Tooltip title={e.timestamp.toLocaleString()}>
							<TableCell>{e.timestamp.toLocaleDateString()}</TableCell>
							</Tooltip>
							<TableCell style={{fontFamily: "monospace"}}>
								{e.from === props.address ? `\u00a0\u00a0To\u00a0` : `From\u00a0`}
								<Link href={`${explorerURL}/address/${addr}`} style={{fontFamily: "monospace"}}>
									{fmtAddress(addr)}
								</Link>
							</TableCell>
							<TableCell style={{
								whiteSpace: "nowrap",
								color: (e.to === props.address) ? "#4caf50" : undefined,
								}} align="right">
								{e.to === props.address ? `+` : ``}
								{fmtAmount(e.amount, erc20.decimals)} {erc20.symbol}
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
export default TransferHistory