import ImportExport from '@material-ui/icons/ImportExport'

import { AppDefinition } from "../../components/app-definition"
import SendReceiveApp from "./send-receive";

export const SendReceive: AppDefinition = {
	id: "send-receive",
	title: "Send/Receive",
	icon: ImportExport,
	core: true,
	renderApp: SendReceiveApp,
}