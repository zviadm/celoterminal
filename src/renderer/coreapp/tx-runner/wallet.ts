import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import { ReadOnlyWallet } from '@celo/connect'
import { AddressValidation, newLedgerWalletWithSetup } from '@celo/wallet-ledger'
import { LocalWallet } from '@celo/wallet-local'

import { Account, LocalAccount } from '../../../lib/accounts'
import { decryptLocalKey } from '../../../lib/accountsdb'
import { UserError } from '../../../lib/error'
import { CFG } from '../../../lib/cfg'
import { SpectronNetworkId } from '../../../lib/spectron-utils/constants'

export async function createWallet(a: Account, password?: string): Promise<{
	wallet: ReadOnlyWallet
	transport?: {close: () => void}
}> {
	if (CFG().networkId === SpectronNetworkId) {
		// NOTE(zviad): celo-devchain (i.e. @celo/ganache-cli) doesn't support
		// locally signed transactions. Thus it is important to make sure we aren't
		// locally signing transactions when tests are running.
		return {wallet: new LocalWallet()}
	}
	switch (a.type) {
		case "local": {
			if (!password) {
				throw new UserError("Password must be entered to unlock local accounts.")
			}
			const wallet = new LocalWallet()
			const localKey = decryptLocalKey(a.encryptedData, password)
			wallet.addAccount(localKey.privateKey)
			return {wallet}
		}
		case "ledger": {
			const _transport = await TransportNodeHid.open()
			try {
				const wallet = await newLedgerWalletWithSetup(
					_transport,
					[a.derivationPathIndex],
					a.baseDerivationPath,
					AddressValidation.never)
				return {wallet, transport: _transport}
			} catch (e) {
				_transport.close()
				throw e
			}
		}
		default:
			throw new UserError(`Read-only accounts can not sign transactions.`)
	}
}

export const canDecryptLocalKey = (
	account: LocalAccount,
	password: string): boolean => {
	try {
		decryptLocalKey(account.encryptedData, password)
		return true
	} catch (e) {
		return false
	}
}