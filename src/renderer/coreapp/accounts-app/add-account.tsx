import * as React from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip } from '@material-ui/core'
import GetApp from '@material-ui/icons/GetApp'

import AccountIcon from './account-icon'
import AppSection from '../../components/app-section'
import SectionTitle from '../../components/section-title'

export type AddType =
	"add-ledger" | "add-addressonly" |
	"create-local" | "import-local" |
	"create-multisig" | "import-multisig"

export const AddAccount = (props: {
	onAdd: (type: AddType) => void,
	onCancel: () => void,
	disabled?: AddType[],
}): JSX.Element => {
	const options: {type: AddType, label: string, icon: JSX.Element, desc: string}[] = [
		{
			type: "create-local",
			label: "Create Local Account",
			icon: <AccountIcon type="local" />,
			desc: "Local accounts are stored on your computer, encrypted by your password.",
		},
		{
			type: "import-local",
			label: "Import Local Account",
			icon: <GetApp />,
			desc: "Import local accounts using Valora account key, Mnemonic phrase or Private Key.",
		},
		{
			type: "add-ledger",
			label: "Add Ledger Account",
			icon: <AccountIcon type="ledger" />,
			desc: "Add account from your Ledger hardware wallet.",
		},
		{
			type: "add-addressonly",
			label: "Add ReadOnly Account",
			icon: <AccountIcon type="address-only" />,
			desc: "You can add any arbitrary address/account as a read-only account.",
		},
		{
			type: "create-multisig",
			label: "Create MultiSig Account",
			icon: <AccountIcon type="multisig" />,
			desc:
				`MultiSig refers to a special type of account that requires multiple separate entities or ` +
				`keys to confirm transactions before they are executed.`
		},
		{
			type: "import-multisig",
			label: "Import MultiSig Account",
			icon: <AccountIcon type="multisig" />,
			desc:
				`Import already existing MultiSig account. ` +
				`You must have one of the MultiSig owner addresses added in Celo Terminal.`
		},
	]

	const onAdd = props.onAdd
	const AddButton = (props: {
		type: AddType,
		label: string,
		icon: JSX.Element,
		desc: string,
	}) => {
		return (
			<Tooltip title={props.desc}>
				<Button
					style={{marginRight: 5, marginLeft: 5, width: "50%"}}
					color="primary"
					variant="outlined"
					startIcon={props.icon}
					onClick={() => onAdd(props.type)}
				>{props.label}</Button>
			</Tooltip>
		)
	}

	return (<>
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Add account</DialogTitle>
			<DialogContent style={{width: 600}}>
				<Box display="flex" flexDirection="column">
					<AppSection>
						<SectionTitle>Standard Accounts</SectionTitle>
						<Box display="flex" flexDirection="row" marginTop={1}>
							<AddButton {...options[0]} />
							<AddButton {...options[1]} />
						</Box>
						<Box display="flex" flexDirection="row" marginTop={1}>
							<AddButton {...options[2]} />
							<AddButton {...options[3]} />
						</Box>
					</AppSection>
					<AppSection>
						<SectionTitle>Smart-Contract Based Accounts</SectionTitle>
						<Box display="flex" flexDirection="row" marginTop={1}>
							<AddButton {...options[4]} />
							<AddButton {...options[5]} />
						</Box>
					</AppSection>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
			</DialogActions>
		</Dialog>
	</>)
}