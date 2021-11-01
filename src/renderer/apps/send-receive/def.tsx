import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import SendReceiveApp from "./send-receive"
import icon from './send-receive-icon.png'

export const SendReceive: AppDefinition = {
	id: "send-receive",
	title: "Send/Receive",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	core: true,
	renderApp: SendReceiveApp,
}