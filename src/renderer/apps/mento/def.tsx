import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import MentoApp from "./mento";
import icon from './mento-icon.png'

export const Mento: AppDefinition = {
	id: "mento",
	title: "Mento",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	url: "https://docs.celo.org/celo-codebase/protocol/stability",
	description: `
	Trade between CELO and native stable assets
	like cUSD and cEUR using built-in Mento exchange.
	`,
	renderApp: MentoApp,
}