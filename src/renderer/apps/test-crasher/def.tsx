import { AppDefinition } from "../../components/app-definition"
import CrasherApp from "./crasher"
import BugReport from "@material-ui/icons/BugReport"

export const Crasher: AppDefinition = {
	id: "test-crasher",
	title: "Crasher",
	icon: BugReport,
	description: `
	This is a test-only app that crashes right away. Useful to test Celo Terminal
	to make sure single crashing app doesn't crash the whole app.
	`,
	renderApp: CrasherApp,
}
