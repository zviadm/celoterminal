import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import ContractoApp from "./contracto"
import FindInPage from "@material-ui/icons/FindInPage"

export const Contracto: AppDefinition = {
	id: "contracto",
	title: "Contracto",
	icon: <FindInPage />,
	iconLarge: <FindInPage fontSize="large" />,
	description: `
	Contracto allows users to view data and send custom transactions to arbitrary
	contracts that have verified source code.
	`,
	renderApp: ContractoApp,
}
