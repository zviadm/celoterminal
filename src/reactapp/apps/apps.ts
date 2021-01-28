import { TXFunc, TXFinishFunc } from '../state/transactions'
import { Account } from '../state/accounts'
import { LockerApp } from './locker/locker'
import { SendReceiveApp } from './send-receive/send-receive'

export interface AppDefinition {
	name: string
	renderApp: (props: {
		accounts: Account[],
		selectedAccount: Account,
		runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
		onError: (e: Error) => void,
	}) => JSX.Element
}

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
