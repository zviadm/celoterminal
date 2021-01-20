import { Account } from '../state/accounts-state'
import { sendReceiveApp } from './send-receive/send-receive'

export const AppList: AppDefinition[] = [
	{
		name: "Send/Receive",
		renderApp: sendReceiveApp,
	},
]

export interface AppDefinition {
	name: string
	renderApp: (props: {
		accounts: Account[],
		selectedAccount: Account,
	}) => JSX.Element
}
