import { AppDefinition } from '../components/app-definition'
import { Locker } from './locker/def'
import { SendReceive } from './send-receive/def'

export const AppList: AppDefinition[] = [
	SendReceive,
	Locker,
]
