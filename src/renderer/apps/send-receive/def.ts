import Forward from '@material-ui/icons/Forward'

import { AppDefinition } from "../../components/app-definition"
import SendReceiveApp from "./send-receive";

export const SendReceive: AppDefinition = {
	id: "send-receive",
	title: "Send/Receive",
	icon: Forward,
	core: true,
	renderApp: SendReceiveApp,
}