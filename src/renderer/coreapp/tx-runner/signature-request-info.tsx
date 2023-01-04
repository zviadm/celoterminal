import BigNumber from 'bignumber.js'

import { EstimatedFee } from './fee-estimation'
import { ParsedSignatureRequest } from './transaction-parser'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	TableContainer, Table, TableBody, TableRow, TableCell,
	Paper, IconButton
} from '@material-ui/core'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp'
import { ParsedTXData } from '../../../lib/tx-parser/tx-parser'

const SignatureRequestInfo = (props: {
	req: ParsedSignatureRequest
	fee: EstimatedFee
}): JSX.Element => {
	const openInitially = props.req.type === "transaction" ? !!props.req.parsedTX : true
	const [open, setOpen] = React.useState(openInitially)
	const [openFee, setOpenFee] = React.useState(false)

	const sectionTitle =
		props.req.type === "transaction" ? "Contract" :
		props.req.type === "signPersonal" ? "Sign" :
		""
	const infoShort =
		props.req.type === "transaction" ? props.req.contractName :
		props.req.type === "signPersonal" ? `DATA: ${(props.req.dataAsText || props.req.data).substring(0, 20)}...` :
		""
	const infoExpanded =
		props.req.type === "transaction" ?
			<>
				{props.req.parseErr &&
				<TableRow>
					<TableCell></TableCell>
					<TableCell
						colSpan={2}
						style={{
							color: "red",
							fontFamily: "monospace",
							overflowWrap: "anywhere"}}>TX Parsing {props.req.parseErr}</TableCell>
				</TableRow>}
				{props.req.parsedTX ?
				<ParsedTXRow tx={props.req.parsedTX} />
				:
				<TableRow>
					<TableCell></TableCell>
					<TableCell
						colSpan={2}
						style={{
							fontFamily: "monospace",
							overflowWrap: "anywhere"}}>CALLDATA: {props.req.encodedABI}</TableCell>
				</TableRow>}
			</> :
		props.req.type === "signPersonal" ?
			<TableRow>
				<TableCell></TableCell>
				<TableCell
					colSpan={2}
					style={{
						fontFamily: "monospace",
						overflowWrap: "anywhere"}}>{props.req.dataAsText || props.req.data}</TableCell>
			</TableRow> :
		""

	return (
		<TableContainer component={Paper}>
			<Table size="small">
				<TableBody>
					<TableRow>
						<TableCell width="20%">{sectionTitle}</TableCell>
						<TableCell style={{fontFamily: "monospace"}}>{infoShort}</TableCell>
						<TableCell width="1%">
							<IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
								{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
							</IconButton>
						</TableCell>
					</TableRow>
					{open && infoExpanded}
					{props.req.type === "transaction" && props.req.sendValue &&
					<TableRow>
							<TableCell>Send</TableCell>
							<TableCell colSpan={2}>{fmtAmount(props.req.sendValue, "CELO")} CELO</TableCell>
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
export default SignatureRequestInfo

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