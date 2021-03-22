import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import SavingsCELOApp from "./savingscelo"
import DesktopMac from '@material-ui/icons/DesktopMac'

export const SavingsCELO: AppDefinition = {
	id: "savingscelo",
	title: "SavingsCELO",
	icon: <DesktopMac />,
	iconLarge: <DesktopMac fontSize="large" />,
	// url: "https://celovote.com",
	description: `
	SavingsCELO is a tokenized representation of locked and voting CELO. Earn voter
	rewards while still keeping your assets liquid and transferrable.
	`,
	renderApp: SavingsCELOApp,
}
