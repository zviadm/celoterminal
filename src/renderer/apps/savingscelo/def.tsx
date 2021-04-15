import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import SavingsCELOApp from "./savingscelo"
import savingsCELOIcon from "./savingscelo-icon.png"

export const SavingsCELO: AppDefinition = {
	id: "savingscelo",
	title: "SavingsCELO",
	icon: <img src={savingsCELOIcon} width="24px" />,
	iconLarge: <img src={savingsCELOIcon} width="35px" />,
	url: "https://github.com/zviadm/savingscelo/wiki",
	description: `
	SavingsCELO is a tokenized representation of locked and voting CELO. Earn voter
	rewards while still keeping your assets liquid and transferrable.
	`,
	renderApp: SavingsCELOApp,
}
