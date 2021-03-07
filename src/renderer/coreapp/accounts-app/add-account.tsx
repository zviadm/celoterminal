import * as React from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'
import { GetApp } from '@material-ui/icons'

import AccountIcon from './account-icon'

export type AddType =
	"add-ledger" | "add-addressonly" |
	"create-local" | "import-local" |
	"create-multisig" | "import-multisig"

export const AddAccount = (props: {
	onAdd: (type: AddType) => void,
	onCancel: () => void,
	disabled?: AddType[],
}): JSX.Element => {
	const options: {type: AddType, label: string, icon: JSX.Element}[] = [
		{
			type: "create-local",
			label: "Create Local Account",
			icon: <AccountIcon type="local" />,
		},
		{
			type: "import-local",
			label: "Import Local Account",
			icon: <GetApp />,
		},
		{
			type: "add-ledger",
			label: "Add Ledger Account",
			icon: <AccountIcon type="ledger" />,
		},
		{
			type: "add-addressonly",
			label: "Add ReadOnly Account",
			icon: <AccountIcon type="address-only" />,
		},
		{
			type: "create-multisig",
			label: "Create MultiSig Account",
			icon: <AccountIcon type="multisig" />,
		},
		{
			type: "import-multisig",
			label: "Import MultiSig Account",
			icon: <AccountIcon type="multisig" />,
		},
	]

	return (<>
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Add account</DialogTitle>
			<DialogContent>
				<Box display="flex" flexDirection="column" width={400}>
				{
					options.map((o) => (
						<Button
							key={o.type}
							style={{marginBottom: 10}}
							color="primary"
							variant="outlined"
							startIcon={o.icon}
							onClick={() => props.onAdd(o.type)}
						>{o.label}</Button>
					))
				}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
			</DialogActions>
		</Dialog>
	</>)
}