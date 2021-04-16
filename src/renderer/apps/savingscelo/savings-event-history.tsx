import BigNumber from 'bignumber.js'
import { savingsToCELO } from 'savingscelo'

import { SavingsEvent } from './history-state'
import { fmtAddress, fmtAmount } from '../../../lib/utils'
import { explorerRootURL } from '../../../lib/cfg'

import * as React from 'react'
import {
	LinearProgress, Table, TableBody,
	TableHead, TableRow, TableCell, Tooltip, Typography
} from '@material-ui/core'

import Link from '../../components/link'
import SectionTitle from '../../components/section-title'

const SavingsEventHistory = (props: {
	events?: SavingsEvent[],
	savingsTotal_CELO: BigNumber,
	savingsTotal_sCELO: BigNumber,
}): JSX.Element => {
	const events = props.events
	const explorerURL = explorerRootURL()
	return (<>
		<SectionTitle>Recent Events</SectionTitle>
		{!events ? <LinearProgress /> :
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>Date</TableCell>
					<TableCell>Type</TableCell>
					<TableCell>CELO</TableCell>
					<TableCell>sCELO</TableCell>
					<TableCell>TXHash</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
			{
				events.map((e) => {
					const inpIsCELO = e.type === "Deposit" || (e.type === "Swap" && e.direction === "buy")
					const amount_sCELO_as_CELO = savingsToCELO(e.amount_sCELO, props.savingsTotal_sCELO, props.savingsTotal_CELO)
					return (
						<TableRow key={e.txHash}>
							<Tooltip title={e.timestamp.toLocaleString()}>
							<TableCell>{e.timestamp.toLocaleDateString()}</TableCell>
							</Tooltip>
							<TableCell>
								{
								e.type === "Deposit" ? "Deposit" :
								e.type === "Withdraw" ? "Withdraw" :
								e.direction === "buy" ? "Buy" : "Sell"
								}
							</TableCell>
							<TableCell style={{
								whiteSpace: "nowrap",
								color: inpIsCELO ? "#f44336" : "#4caf50"}}>
								{inpIsCELO ? "-" : "+"}
								{fmtAmount(e.amount_CELO, "CELO")} CELO
							</TableCell>
							<TableCell style={{
								whiteSpace: "nowrap",
								color: !inpIsCELO ? "#f44336" : "#4caf50"}}>
								{!inpIsCELO ? "-" : "+"}
								{fmtAmount(e.amount_sCELO, 18)} sCELO&nbsp;
								<Typography component="span" color="textSecondary" style={{fontSize: 14}}>
									(~{fmtAmount(amount_sCELO_as_CELO, "CELO")} CELO)
								</Typography>
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
export default SavingsEventHistory