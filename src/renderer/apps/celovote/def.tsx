import * as React from 'react'

import { AppDefinition } from "../../components/app-definition"
import CelovoteApp from "./celovote";
import icon from './icon.png'

export const Celovote: AppDefinition = {
	id: "celovote",
	title: "Celovote",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	url: "https://celovote.com",
	description: `
	Setup your account to automatically vote with your locked CELO
	to maximize staking returns and minimize risk.
	`,
	renderApp: CelovoteApp,
}
