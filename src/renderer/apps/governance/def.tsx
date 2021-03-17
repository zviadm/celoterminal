import * as React from 'react'
import ThumbsUpDown from '@material-ui/icons/ThumbsUpDown'
import { AppDefinition } from "../../components/app-definition"
import GovernanceApp from "./governance"

export const Governance: AppDefinition = {
	id: "governance",
	title: "Governance",
	icon: <ThumbsUpDown />,
	iconLarge: <ThumbsUpDown fontSize="large" />,
	core: true,
	url: "https://docs.celo.org/celo-codebase/protocol/governance",
	renderApp: GovernanceApp,
}