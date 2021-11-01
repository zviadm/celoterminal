import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import MultiSigApp from "./multisig"
import icon from './multisig-icon.png'

export const MultiSig: AppDefinition = {
	id: "multisig",
	title: "MultiSig",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	url: "https://docs.celoterminal.com/guides/multisig-accounts",
	description: `
	Manage MultiSig accounts. Confirm transactions, add/remove owners,
	change signature requirements and more.
	`,
	renderApp: MultiSigApp,
}
