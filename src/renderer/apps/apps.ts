import * as remote from '@electron/remote'
import { AppDefinition } from '../components/app-definition'
import { Celovote } from './celovote/def'
import { SCInspector } from './sc-inspector/def'
import { Governance } from './governance/def'
import { Locker } from './locker/def'
import { MultiSig } from './multisig/def'
import { Portfolio } from './portfolio/def'
import { SavingsCELO } from './savingscelo/def'
import { SendReceive } from './send-receive/def'
import { WalletConnect } from './wallet-connect/def'
import { Swappa } from './swappa/def'
import { Moola } from './moola/def'
import { Crasher } from './test-crasher/def'

export const AppList: AppDefinition[] = [
	// Core Apps.
	Portfolio,
	SendReceive,
	Locker,
	Governance,
	WalletConnect,

	// Optional Apps.
	Celovote,
	MultiSig,
	SCInspector,
	SavingsCELO,
	Swappa,
	Moola,
].concat(remote.app.isPackaged ? [] : [
	// Test/Dev-only Apps.
	Crasher,
])
