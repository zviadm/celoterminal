import { EstimatedFee } from './fee-estimation'
import { ParsedTransaction } from './transaction-parser'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	TableContainer, Table, TableBody, TableRow, TableCell,
	Paper, IconButton
} from '@material-ui/core'
import { KeyboardArrowDown, KeyboardArrowUp }  from '@material-ui/icons'
import BigNumber from 'bignumber.js'

const TransactionInfo = (props: {
	tx: ParsedTransaction
	fee: EstimatedFee
}): JSX.Element => {
	const [open, setOpen] = React.useState(false)
	return (
		<TableContainer component={Paper}>
			<Table size="small">
				<TableBody>
					<TableRow>
						<TableCell width="20%">Contract</TableCell>
						<TableCell>{props.tx.contractName}</TableCell>
						<TableCell width="1%">
							<IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
								{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
							</IconButton>
						</TableCell>
					</TableRow>
					{open && <>
					<TableRow>
						<TableCell></TableCell>
						<TableCell
							colSpan={2}
							style={{
								fontFamily: "monospace",
								textTransform: "uppercase",
								overflowWrap: "anywhere"}}>calldata: {props.tx.encodedABI}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell></TableCell>
						<TableCell
							colSpan={2}
							style={{
								fontFamily: "monospace",
								textTransform: "uppercase",
								overflowWrap: "anywhere"}}>gas: {props.fee.estimatedGas.toFixed(0)}</TableCell>
					</TableRow>
					</>}
					{props.tx.transferValue &&
					<TableRow>
						<TableCell>Transfer</TableCell>
						<TableCell colSpan={2}>{fmtAmount(props.tx.transferValue, "CELO")} CELO</TableCell>
					</TableRow>}
					<TableRow>
						<TableCell>Fee</TableCell>
						<TableCell colSpan={2}>
							~{props.fee.estimatedFee.toFixed(4, BigNumber.ROUND_UP)} {props.fee.feeCurrency}
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</TableContainer>
	)
}
export default TransactionInfo