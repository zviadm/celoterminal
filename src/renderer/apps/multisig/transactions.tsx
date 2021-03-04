import { MultiSigAccount } from '../../../lib/accounts'

import * as React from 'react'
import {
	TableBody, Table, TableRow, TableCell, TableHead, Button,
} from '@material-ui/core'

export const TransactionsTable = (props: {
	account: MultiSigAccount,
	requiredSignatures: number,
	internalRequiredSignatures: number,
	pendingTXs: {
		idx: number,
		destination: string,
		confirmations: string[],
	}[],
	contractNames: Map<string, string>,
	onExecute: (txIdx: number) => void,
	onConfirm: (txIdx: number) => void,
	onRevoke: (txIdx: number) => void,
}): JSX.Element => {

	const requiredConfirms = (destination: string) => {
		return (destination === props.account.address) ? props.internalRequiredSignatures : props.requiredSignatures
	}
	return (
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell>ID</TableCell>
					<TableCell width="100%">Contract & Data</TableCell>
					<TableCell align="right">Confirms</TableCell>
					<TableCell></TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{
					props.pendingTXs.map((t) => {
						const required = requiredConfirms(t.destination)
						const canExecute = required <= t.confirmations.length
						const confirmedBySelf = t.confirmations.indexOf(props.account.ownerAddress) >= 0
						return (
							<TableRow key={t.idx}>
								<TableCell>{t.idx.toString()}</TableCell>
								<TableCell>{props.contractNames.get(t.destination)}</TableCell>
								<TableCell align="right">
									{t.confirmations.length} / {required.toString()}
								</TableCell>
								<TableCell>
									{canExecute ?
									<Button
										variant="outlined"
										color="primary"
										onClick={() => { props.onExecute(t.idx) }}
									>Execute</Button> : (
										!confirmedBySelf ?
										<Button
											variant="outlined"
											color="primary"
											onClick={() => { props.onConfirm(t.idx) }}
										>Confirm</Button> :
										<Button
											variant="outlined"
											color="secondary"
											onClick={() => { props.onRevoke(t.idx) }}
										>Revoke</Button>
									)}
								</TableCell>
							</TableRow>
						)
					})
				}
			</TableBody>
		</Table>
	)
}