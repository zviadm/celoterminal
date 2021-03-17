import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import CrasherApp from "./crasher"
import BugReport from "@material-ui/icons/BugReport"

export const Crasher: AppDefinition = {
	id: "test-crasher",
	title: "Crasher",
	icon: <BugReport />,
	iconLarge: <BugReport fontSize="large" />,
	description: `
	This is a test-only app that crashes right away.
	`,
	renderApp: CrasherApp,
}
