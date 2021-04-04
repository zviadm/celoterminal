import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import ContractoApp from "./contracto"
import BugReport from "@material-ui/icons/BugReport"

export const Contracto: AppDefinition = {
	id: "contracto",
	title: "Contracto",
	icon: <BugReport />,
	iconLarge: <BugReport fontSize="large" />,
	description: `
	Contracto allows users to view and send custom transactions to arbitrary
	contracts that have verified source code.
	`,
	renderApp: ContractoApp,
}
