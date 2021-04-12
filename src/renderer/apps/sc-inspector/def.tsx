import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import SCInspectorApp from "./sc-inspector"
import FindInPage from "@material-ui/icons/FindInPage"

export const SCInspector: AppDefinition = {
	id: "sc-inspector",
	title: "SC Inspector",
	icon: <FindInPage />,
	iconLarge: <FindInPage fontSize="large" />,
	description: `
	SmartContract Inspector allows users to view data and send custom transactions to arbitrary
	smart contracts that have verified source code.
	`,
	renderApp: SCInspectorApp,
}
