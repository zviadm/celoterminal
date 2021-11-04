import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import GovernanceApp from "./governance"
import icon from './governance-icon.png'

export const Governance: AppDefinition = {
	id: "governance",
	title: "Governance",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	core: true,
	url: "https://docs.celo.org/celo-codebase/protocol/governance",
	renderApp: GovernanceApp,
}