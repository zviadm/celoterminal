import BigNumber from 'bignumber.js'

import { EstimatedFee } from './fee-estimation'
import { ParsedTransaction } from './transaction-parser'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	TableContainer, Table, TableBody, TableRow, TableCell,
	Paper, IconButton
} from '@material-ui/core'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp'
import { ParsedTXData } from '../../../lib/tx-parser/tx-parser'

const TransactionInfo = (props: {
	tx: ParsedTransaction
	fee: EstimatedFee
}): JSX.Element => {
	const [open, setOpen] = React.useState(!!props.tx.parsedTX)
	const [openFee, setOpenFee] = React.useState(false)
	return (
		<TableContainer component={Paper}>
			<Table size="small">
				<TableBody>
					<TableRow>
						<TableCell width="20%">Contract</TableCell>
						<TableCell style={{fontFamily: "monospace"}}>{props.tx.contractName}</TableCell>
						<TableCell width="1%">
							<IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
								{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
							</IconButton>
						</TableCell>
					</TableRow>
					{open && <>
					{props.tx.parseErr &&
					<TableRow>
						<TableCell></TableCell>
						<TableCell
							colSpan={2}
							style={{
								color: "red",
								fontFamily: "monospace",
								overflowWrap: "anywhere"}}>TX Parsing {props.tx.parseErr}</TableCell>
					</TableRow>}
					{props.tx.parsedTX ?
					<ParsedTXRow tx={props.tx.parsedTX} />
					:
					<TableRow>
						<TableCell></TableCell>
						<TableCell
							colSpan={2}
							style={{
								fontFamily: "monospace",
								overflowWrap: "anywhere"}}>CALLDATA: {props.tx.encodedABI}</TableCell>
					</TableRow>}
					</>}
					{props.tx.sendValue &&
					<TableRow>
						<TableCell>Send</TableCell>
						<TableCell colSpan={2}>{fmtAmount(props.tx.sendValue, "CELO")} CELO</TableCell>
					</TableRow>}
					<TableRow>
						<TableCell>Fee</TableCell>
						<TableCell>
							~{props.fee.estimatedFee.toFixed(6, BigNumber.ROUND_UP)} {props.fee.feeCurrency}
						</TableCell>
						<TableCell>
							<IconButton aria-label="expand row" size="small" onClick={() => setOpenFee(!openFee)}>
								{openFee ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
							</IconButton>
						</TableCell>
					</TableRow>
					{openFee &&
					<TableRow>
						<TableCell></TableCell>
						<TableCell
							colSpan={2}
							style={{
								fontFamily: "monospace",
								overflowWrap: "anywhere"}}>GAS: {props.fee.estimatedGas.toFixed(0)}</TableCell>
					</TableRow>}
				</TableBody>
			</Table>
		</TableContainer>
	)
}
export default TransactionInfo

const ParsedTXRow = (props: {tx: ParsedTXData}) => {
	const text = (<>
		{props.tx.txAbi.name}
		{props.tx.txData.map((i, idx) => {
			return <span key={`txdata-${idx}`}><br />&nbsp;&nbsp;{i.input.name} = {`${i.value}`}</span>
		})}
	</>)
	return (
		<TableRow>
			<TableCell></TableCell>
			<TableCell
				colSpan={2}
				style={{
					fontFamily: "monospace",
					overflowWrap: "anywhere"}}>{text}</TableCell>
		</TableRow>
	)
}