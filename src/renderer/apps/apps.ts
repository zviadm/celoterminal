import { remote } from 'electron'
import { AppDefinition } from '../components/app-definition'
import { Celovote } from './celovote/def'
import { Governance } from './governance/def'
import { Locker } from './locker/def'
import { Mento } from './mento/def'
import { MultiSig } from './multisig/def'
import { Portfolio } from './portfolio/def'
import { SendReceive } from './send-receive/def'
import { Crasher } from './test-crasher/def'


export const AppList: AppDefinition[] = [
	// Core Apps.
	Portfolio,
	SendReceive,
	Locker,
	Governance,

	// Optional Apps.
	Mento,
	Celovote,
	MultiSig,
].concat(remote.app.isPackaged ? [] : [
	// Test/Dev-only Apps.
	Crasher,
])