import { AppDefinition } from '../components/app-definition'
import { Celovote } from './celovote/def'
import { Locker } from './locker/def'
import { Mento } from './mento/def'
import { SendReceive } from './send-receive/def'

export const AppList: AppDefinition[] = [
	// Core Apps.
	SendReceive,
	Locker,

	// Optional Apps.
	Mento,
	Celovote,
]
