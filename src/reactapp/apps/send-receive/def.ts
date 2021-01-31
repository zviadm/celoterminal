import ImportExport from '@material-ui/icons/ImportExport'

import { AppDefinition } from "../../components/app-definition"
import SendReceiveApp from "./send-receive";

export const SendReceive: AppDefinition = {
	name: "Send/Receive",
	icon: ImportExport,
	renderApp: SendReceiveApp,
}