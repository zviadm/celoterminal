import * as React from 'react'
import Loop from '@material-ui/icons/Loop'

import { AppDefinition } from "../../components/app-definition"
import MentoApp from "./mento";

export const Mento: AppDefinition = {
	id: "mento",
	title: "Mento",
	icon: <Loop />,
	iconLarge: <Loop fontSize="large" />,
	url: "https://docs.celo.org/celo-codebase/protocol/stability",
	description: `
	Trade between CELO and native stable assets
	like cUSD and cEUR using built-in Mento exchange.
	`,
	renderApp: MentoApp,
}