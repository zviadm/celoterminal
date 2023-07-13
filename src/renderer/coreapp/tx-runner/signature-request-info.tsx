import BigNumber from 'bignumber.js'

import { EstimatedFee } from './fee-estimation'
import { ParsedSignatureRequest } from './transaction-parser'
import { fmtAmount, throwUnreachableError } from '../../../lib/utils'

import * as React from 'react'
import {
	TableContainer, Table, TableBody, TableRow, TableCell,
	Paper, IconButton
} from '@material-ui/core'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp'
import { ParsedTXData } from '../../../lib/tx-parser/tx-parser'

const requestInfo = (req: ParsedSignatureRequest): {
	sectionTitle: JSX.Element | string,
	infoShort: JSX.Element | string,
	infoExpanded: JSX.Element | string,
} => {
	switch (req.type) {
		case "transaction":
			return {
				sectionTitle: "Contract",
				infoShort: req.contractName,
				infoExpanded:
					<>
						{req.parseErr &&
						<TableRow>
							<TableCell></TableCell>
							<TableCell
								colSpan={2}
								style={{
									color: "red",
									fontFamily: "monospace",
									overflowWrap: "anywhere"}}>TX Parsing {req.parseErr}</TableCell>
						</TableRow>}
						{req.parsedTX ?
						<ParsedTXRow tx={req.parsedTX} />
						:
						<TableRow>
							<TableCell></TableCell>
							<TableCell
								colSpan={2}
								style={{
									fontFamily: "monospace",
									overflowWrap: "anywhere"}}>CALLDATA: {req.encodedABI}</TableCell>
						</TableRow>}
					</>
			}
		case "signPersonal":
			return {
				sectionTitle: "Sign",
				infoShort: `DATA: ${(req.dataAsText || req.data).substring(0, 20)}...`,
				infoExpanded:
					<TableRow>
						<TableCell></TableCell>
						<TableCell
							colSpan={2}
							style={{
								fontFamily: "monospace",
								overflowWrap: "anywhere"}}>{req.dataAsText || req.data}</TableCell>
					</TableRow>
			}
		case "signTypedData_v4":
			// TODO(zviad): Need to have better formatting for typed data
			return {
				sectionTitle: "Sign",
				infoShort: `Typed Data`,
				infoExpanded:
					<TableRow>
						<TableCell></TableCell>
						<TableCell
							colSpan={2}
							style={{
								fontFamily: "monospace",
								overflowWrap: "anywhere"}}><pre>{JSON.stringify(req.data, undefined, 2)}</pre></TableCell>
					</TableRow>
			}
		default: throwUnreachableError(req)
	}
}

const SignatureRequestInfo = (props: {
	req: ParsedSignatureRequest
	fee: EstimatedFee
}): JSX.Element => {
	const openInitially = props.req.type === "transaction" ? !!props.req.parsedTX : true
	const [open, setOpen] = React.useState(openInitially)
	const [openFee, setOpenFee] = React.useState(false)
	const {sectionTitle, infoShort, infoExpanded} = requestInfo(props.req)
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