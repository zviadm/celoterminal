import { isValidAddress } from 'ethereumjs-util'

import * as React from "react"
import {
	Box, Table, TableBody, TableRow, TableCell, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from "@material-ui/core"
import Add from "@material-ui/icons/Add"

import LinkedAddress from "../../components/linked-address"
import NumberInput from '../../components/number-input'

export const OwnersTable = (props: {
	owners: string[]
	onRemove: (owner: string) => void,
	onReplace: (owner: string, newOwner: string) => void,
	onAdd: (owner: string) => void,
}): JSX.Element => {
	const [toReplace, setToReplace] = React.useState<string | undefined>()
	const [toAdd, setToAdd] = React.useState(false)
	return (
		<Box display="flex" flexDirection="column">
			{toAdd &&
			<InputAddressDialog
				title="Add Owner"
				actionLabel="Add"
				onCancel={() => { setToAdd(false) }}
				onAction={(address) => {
					setToAdd(false)
					props.onAdd(address)
				}}
			/>}
			{toReplace &&
			<InputAddressDialog
				title="Replace Owner"
				actionLabel="Replace"
				onCancel={() => { setToReplace(undefined) }}
				onAction={(address) => {
					setToReplace(undefined)
					props.onReplace(toReplace, address)
				}}
			/>}

			<Table size="small">
				<TableBody>
					{props.owners.map((o) => {
						return (
							<TableRow key={o}>
								<TableCell width="100%"><LinkedAddress address={o} /></TableCell>
								<TableCell>
									<Button
										variant="outlined"
										color="secondary"
										onClick={() => { setToReplace(o) }}
										>Replace</Button>
								</TableCell>
								<TableCell>
									<Button
										variant="outlined"
										color="secondary"
										onClick={() => { props.onRemove(o) }}
										>Remove</Button>
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>
			<Box display="flex" flexDirection="column" marginTop={1}>
				<Button
					variant="outlined"
					color="primary"
					startIcon={<Add />}
					onClick={() => { setToAdd(true) }}>
					Add Owner
				</Button>
			</Box>
		</Box>
	)
}

const InputAddressDialog = (props: {
	title: string,
	actionLabel: string,
	cancelLabel?: string,
	inputLabel?: string,
	onCancel: () => void,
	onAction: (address: string) => void,
}) => {
	const [address, setAddress] = React.useState("")
	const handleAction = () => {
		props.onAction(address)
	}
	const canAction = isValidAddress(address)
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>{props.title}</DialogTitle>
			<DialogContent>
				<Box display="flex" width={400}>
					<TextField
						id="address-input"
						autoFocus
						margin="dense"
						size="medium"
						fullWidth={true}
						inputProps={{style: {fontFamily: "monospace"}, spellCheck: false}}
						InputLabelProps={{shrink: true}}
						placeholder="0x..."
						value={address}
						label={props.inputLabel || "Address"}
						onChange={(e) => { setAddress(e.target.value) }}
					/>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>{props.cancelLabel || "Cancel"}</Button>
				<Button
					id="input-address-action"
					disabled={!canAction} onClick={handleAction}>{props.actionLabel}</Button>
			</DialogActions>
		</Dialog>
	)
}

export const SignaturesTable = (props: {
	requiredSignatures: number,
	internalRequiredSignatures: number,
	onChangeRequiredSignatures: (n: number) => void,
	onChangeInternalRequiredSignatures: (n: number) => void,
}): JSX.Element => {
	const [changeRequired, setChangeRequired] = React.useState(false)
	const [changeInternalRequired, setChangeInternalRequired] = React.useState(false)
	return (
		<Table size="small">
			{changeRequired &&
			<InputNumberDialog
				title="Change Required Signatures"
				actionLabel="Change"
				inputLabel="Required Signatures"
				placeholder={props.requiredSignatures.toString()}
				onCancel={() => { setChangeRequired(false) }}
				onAction={(v) => {
					setChangeRequired(false)
					props.onChangeRequiredSignatures(v)
				}}
			/>}
			{changeInternalRequired &&
			<InputNumberDialog
				title="Change Required Signatures"
				actionLabel="Change"
				inputLabel="Required Signatures"
				placeholder={props.internalRequiredSignatures.toString()}
				onCancel={() => { setChangeInternalRequired(false) }}
				onAction={(v) => {
					setChangeInternalRequired(false)
					props.onChangeInternalRequiredSignatures(v)
				}}
			/>}
			<TableBody>
				<TableRow>
					<TableCell width="100%">For executing transactions</TableCell>
					<TableCell>{props.requiredSignatures.toString()}</TableCell>
					<TableCell>
						<Button
							id="change-required"
							onClick={() => { setChangeRequired(true) }}
							variant="outlined" color="secondary">Change</Button>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell width="100%">For changing MultiSig properties</TableCell>
					<TableCell>{props.internalRequiredSignatures.toString()}</TableCell>
					<TableCell>
						<Button
							id="change-internal-required"
							onClick={() => { setChangeInternalRequired(true) }}
							variant="outlined" color="secondary">Change</Button>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	)
}

const InputNumberDialog = (props: {
	title: string,
	actionLabel: string,
	inputLabel: string,
	placeholder: string,
	cancelLabel?: string,
	onCancel: () => void,
	onAction: (value: number) => void,
}) => {
	const [value, setValue] = React.useState("")
	const handleAction = () => {
		props.onAction(Number.parseFloat(value))
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>{props.title}</DialogTitle>
			<DialogContent>
				<Box display="flex" width={400}>
					<NumberInput
						id="number-input"
						autoFocus
						margin="dense"
						label={props.inputLabel}
						placeholder={props.placeholder}
						value={value}
						onChangeValue={setValue}
					/>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>{props.cancelLabel || "Cancel"}</Button>
				<Button
					id="input-number-action"
					onClick={handleAction}>{props.actionLabel}</Button>
			</DialogActions>
		</Dialog>
	)
}
