import * as React from 'react'
import Forward from '@material-ui/icons/Forward'
import { AppDefinition } from "../../components/app-definition"
import SendReceiveApp from "./send-receive"

export const SendReceive: AppDefinition = {
	id: "send-receive",
	title: "Send/Receive",
	icon: <Forward />,
	iconLarge: <Forward fontSize="large" />,
	core: true,
	renderApp: SendReceiveApp,
}