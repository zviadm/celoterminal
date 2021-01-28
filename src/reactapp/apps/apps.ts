import { AppDefinition } from '../components/app-definition'

import { LockerApp } from './locker/locker'
import { SendReceiveApp } from './send-receive/send-receive'

export const AppList: AppDefinition[] = [
	{
		name: "Send/Receive",
		renderApp: SendReceiveApp,
	},
	{
		name: "Locker",
		renderApp: LockerApp,
	}
]
