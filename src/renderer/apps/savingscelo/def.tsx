import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import SavingsCELOApp from "./savingscelo"
import icon from "./savingscelo-icon.png"

export const SavingsCELO: AppDefinition = {
	id: "savingscelo",
	title: "SavingsCELO",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	url: "https://docs.savingscelo.com",
	description: `
	SavingsCELO is a tokenized representation of locked and voting CELO. Earn voter
	rewards while still keeping your assets liquid and transferrable.
	`,
	renderApp: SavingsCELOApp,
}
