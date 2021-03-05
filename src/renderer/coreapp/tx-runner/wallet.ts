import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import { ReadOnlyWallet, toTransactionObject } from '@celo/connect'
import { AddressValidation, newLedgerWalletWithSetup } from '@celo/wallet-ledger'
import { LocalWallet } from '@celo/wallet-local'

import { Account, LocalAccount, MultiSigAccount } from '../../../lib/accounts/accounts'
import { decryptLocalKey } from '../../../lib/accounts/accountsdb'
import { UserError } from '../../../lib/error'
import { CFG } from '../../../lib/cfg'
import { SpectronChainId } from '../../../lib/spectron-utils/constants'
import { Transaction } from '../../components/app-definition'
import { ContractKit } from '@celo/contractkit'
import { stringToSolidityBytes } from '@celo/contractkit/lib/wrappers/BaseWrapper'

export async function createWallet(
	account: Account,
	accounts: Account[],
	password?: string): Promise<{
	wallet: ReadOnlyWallet
	transformTX?: (kit: ContractKit, tx: Transaction) => Promise<Transaction>
	transport?: {close: () => void}
}> {
	switch (account.type) {
		case "local": {
			if (!password) {
				throw new UserError("Password must be entered to unlock local accounts.")
			}
			const localKey = decryptLocalKey(account.encryptedData, password)
			const wallet = new LocalWallet()
			// NOTE(zviad): celo-devchain (i.e. @celo/ganache-cli) doesn't support
			// locally signed transactions. Thus it is important to make sure we aren't
			// locally signing transactions when tests are running.
			if (CFG().chainId !== SpectronChainId) {
				wallet.addAccount(localKey.privateKey)
			}
			return {wallet}
		}
		case "ledger": {
			const _transport = await TransportNodeHid.open()
			try {
				const wallet = await newLedgerWalletWithSetup(
					_transport,
					[account.derivationPathIndex],
					account.baseDerivationPath,
					AddressValidation.never)
				return {wallet, transport: _transport}
			} catch (e) {
				_transport.close()
				throw e
			}
		}
		case "multisig": {
			const owner = findMultiSigOwner(account, accounts)
			const ownerWallet = await createWallet(owner, accounts, password)
			const transformTX = async (kit: ContractKit, tx: Transaction): Promise<Transaction> => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				if (ownerWallet.transformTX) {
					tx = await ownerWallet.transformTX(kit, {
						...tx,
						executeUsingParentAccount: false,
					})
				}
				if (tx.executeUsingParentAccount) {
					return tx
				}
				const data = stringToSolidityBytes(tx.tx.txo.encodeABI())
				const destination = tx.tx.txo._parent?.options.address
				if (!destination) {
					throw new Error(`MultiSig accounts can not deploy new contracts.`)
				}
				const txo = multiSig.methods.submitTransaction(
					destination, tx.params?.value?.toString() || 0, data)
				// TODO(zviad): if GAS was provided, we probably want to pass it through and add a bit
				// more GAS because of MultiSig overhead?
				return {tx: toTransactionObject(kit.connection, txo)}
			}
			return {
				wallet: ownerWallet.wallet,
				transport: ownerWallet.transport,
				transformTX,
			}
		}
		default:
			throw new UserError(`Read-only accounts can not sign transactions.`)
	}
}

export const rootAccount = (account: Account, accounts: Account[]): Account => {
	if (account.type !== "multisig") {
		return account
	}
	const owner = findMultiSigOwner(account, accounts)
	return rootAccount(owner, accounts)
}

const findMultiSigOwner = (account: MultiSigAccount, accounts: Account[]): Account => {
	const owner = accounts.find((a) => a.address === account.ownerAddress)
	if (!owner) {
		throw new UserError(`MultiSig owner: ${account.ownerAddress} not found in accounts.`)
	}
	return owner
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
