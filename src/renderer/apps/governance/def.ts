import { AppDefinition } from "../../components/app-definition"

import ThumbsUpDown from '@material-ui/icons/ThumbsUpDown'
import GovernanceApp from "./governance"

export const Governance: AppDefinition = {
	id: "governance",
	title: "Governance",
	icon: ThumbsUpDown,
	core: true,
	url: "https://docs.celo.org/celo-codebase/protocol/governance",
	renderApp: GovernanceApp,
}