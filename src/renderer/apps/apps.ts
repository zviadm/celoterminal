import { remote } from 'electron'
import { AppDefinition } from '../components/app-definition'
import { Celovote } from './celovote/def'
import { SCInspector } from './sc-inspector/def'
import { MultiSend } from './multisend/def'
import { Governance } from './governance/def'
import { Locker } from './locker/def'
import { Mento } from './mento/def'
import { MultiSig } from './multisig/def'
import { Portfolio } from './portfolio/def'
import { SavingsCELO } from './savingscelo/def'
import { SendReceive } from './send-receive/def'
import { WalletConnect } from './wallet-connect/def'
import { Crasher } from './test-crasher/def'

export const AppList: AppDefinition[] = [
	// Core Apps.
	Portfolio,
	SendReceive,
	Locker,
	Governance,
	WalletConnect,

	// Optional Apps.
	Mento,
	Celovote,
	MultiSig,
	SCInspector,
	SavingsCELO,
	MultiSend,
].concat(remote.app.isPackaged ? [] : [
	// Test/Dev-only Apps.
	Crasher,
])
