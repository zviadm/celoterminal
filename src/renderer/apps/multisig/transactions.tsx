import { fmtAmount } from '../../../lib/utils'
import { MultiSigAccount } from '../../../lib/accounts/accounts'
import useLocalStorageState from '../../state/localstorage-state'
import { ParsedTX } from './parse-txs'

import * as React from 'react'
import {
	TableBody, Table, TableRow, TableCell, TableHead, Button, Box, FormControlLabel, Switch, Tooltip, IconButton,
} from '@material-ui/core'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp'
import LinkedAddress from '../../components/linked-address'

export const TransactionsTable = (props: {
	account: MultiSigAccount,
	requiredSignatures: number,
	internalRequiredSignatures: number,
	pendingTXs: ParsedTX[],
	onExecute: (txIdx: number) => void,
	onConfirm: (txIdx: number) => void,
	onRevoke: (txIdx: number) => void,
}): JSX.Element => {
	const [showNoApprovals, setShowNoApprovals] = useLocalStorageState("terminal/multisig/show-no-approvals", false)
	const requiredConfirms = (destination: string) => {
		return (destination === props.account.address) ? props.internalRequiredSignatures : props.requiredSignatures
	}
	const pendingTXs = showNoApprovals ? props.pendingTXs : props.pendingTXs.filter((tx) => tx.tx.confirmations.length > 0)
	return (
		<Box display="flex" flexDirection="column">
		<Tooltip title="Transactions that have 0 approvals are considered deleted.">
			<FormControlLabel
				control={
					<Switch
						id="show-no-approvals"
						checked={showNoApprovals}
						onChange={(event) => { setShowNoApprovals(event.target.checked) }}
						color="secondary"
					/>
				}
				label="Show transactions with no approvals"
			/>
		</Tooltip>
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>ID</TableCell>
					<TableCell width="100%">Contract & Data</TableCell>
					<TableCell />
					<TableCell align="right">Confirms</TableCell>
					<TableCell></TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{
					pendingTXs.map((t) => {
						const required = requiredConfirms(t.tx.destination)
						return (
							<TXRow
								key={t.tx.idx}
								account={props.account}
								tx={t}
								requiredSignatures={required}
								onExecute={props.onExecute}
								onConfirm={props.onConfirm}
								onRevoke={props.onRevoke}
							/>
						)
					})
				}
			</TableBody>
		</Table>
		</Box>
	)
}

const TXRow = (props: {
	account: MultiSigAccount,
	tx: ParsedTX,
	requiredSignatures: number,
	onExecute: (txIdx: number) => void,
	onConfirm: (txIdx: number) => void,
	onRevoke: (txIdx: number) => void,
}) => {
	const [open, setOpen] = React.useState(false)
	const canExecute = props.requiredSignatures <= props.tx.tx.confirmations.length
	const confirmedBySelf = props.tx.tx.confirmations.indexOf(props.account.ownerAddress) >= 0

	const txData = props.tx.parsedTX ? (<>
		{props.tx.parsedTX.txAbi.name}
		{props.tx.parsedTX.txData.map((i, idx) => {
			return <span key={`txdata-${idx}`}><br />&nbsp;&nbsp;{i.input.name} = {`${i.value}`}</span>
		})}
	</>) : `CALLDATA: ${props.tx.tx.data}`
	return (<>
		<TableRow>
			<TableCell>{props.tx.tx.idx.toString()}</TableCell>
			<TableCell>
				<LinkedAddress
					name={props.tx.destinationName}
					address={props.tx.tx.destination}
				/>
			</TableCell>
			<TableCell width="1%">
				<IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
					{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
				</IconButton>
			</TableCell>
			<TableCell align="right">
				{props.tx.tx.confirmations.length} / {props.requiredSignatures.toString()}
			</TableCell>
			<TableCell>
				{canExecute ?
				<Button
					variant="outlined"
					color="primary"
					onClick={() => { props.onExecute(props.tx.tx.idx) }}
				>Execute</Button> : (
					!confirmedBySelf ?
					<Button
						variant="outlined"
						color="primary"
						onClick={() => { props.onConfirm(props.tx.tx.idx) }}
					>Confirm</Button> :
					<Button
						variant="outlined"
						color="secondary"
						onClick={() => { props.onRevoke(props.tx.tx.idx) }}
					>Revoke</Button>
				)}
			</TableCell>
		</TableRow>
		{open && <>
		<TableRow>
			<TableCell />
			<TableCell
				colSpan={2}
				style={{
					fontFamily: "monospace",
					overflowWrap: "anywhere"}}>SEND: {fmtAmount(props.tx.tx.value, "CELO")} CELO</TableCell>
			<TableCell colSpan={2} />
		</TableRow>
		<TableRow>
			<TableCell />
			<TableCell
				colSpan={2}
				style={{
					fontFamily: "monospace",
					overflowWrap: "anywhere"}}>{txData}</TableCell>
			<TableCell colSpan={2} />
		</TableRow>
		</>}
	</>)
}