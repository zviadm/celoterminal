import { ReadOnlyWallet , CeloTransactionObject, CeloTxReceipt } from '@celo/connect'
import { AddressValidation, newLedgerWalletWithSetup } from '@celo/wallet-ledger'
// import { LocalWallet } from '@celo/wallet-local'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'

import { Account } from '../common/accounts'
import { RunTXsReq, RunTXsResp } from '../common/ipc'

export async function handleRunTXs(
	event: Electron.IpcMainInvokeEvent,
	args: RunTXsReq): Promise<RunTXsResp> {

	console.info(`event received`, args)
	// throw new Error('testing error!')
	const devices = await TransportNodeHid.list()
	console.info(`devices`, devices)
	const w = await createWallet(args.selectedAccount)
	console.info(`wallet created`, w)
	return []
}

// const _transportLedgerP: Promise<unknown> | undefined = undefined

export async function createWallet(a: Account): Promise<ReadOnlyWallet> {
	switch (a.type) {
		// case "local": {
		// 	const w = new LocalWallet()
		// 	return w
		// }
		case "ledger": {
			// if (!_transportLedgerP) {
			// 	console.info(`transport create call`)
			// 	_transportLedgerP = TransportNodeHid.open()
			// 	_transportLedgerP?.catch((e) => {
			// 		console.error(`transport create err: ${e}`)
			// 		_transportLedgerP = undefined
			// 	})
			// }
			const _transport = await TransportNodeHid.open()
			console.info(`transport created`, _transport)
			const w = await newLedgerWalletWithSetup(
				_transport,
				[a.derivationPathIndex],
				a.baseDerivationPath,
				AddressValidation.never)
			return w
		}
		case "address-only":
			throw new Error("address-only account can not sign transactions!")
		// default:
		// 	throw new Error(`unknown account type: ${a.type}`)
	}
}