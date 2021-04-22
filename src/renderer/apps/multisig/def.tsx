import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import MultiSigApp from "./multisig"
import Group from '@material-ui/icons/Group'

export const MultiSig: AppDefinition = {
	id: "multisig",
	title: "MultiSig",
	icon: <Group />,
	iconLarge: <Group fontSize="large" />,
	url: "https://docs.celoterminal.com/guides/multisig-accounts",
	description: `
	Manage MultiSig accounts. Confirm transactions, add/remove owners,
	change signature requirements and more.
	`,
	renderApp: MultiSigApp,
}
