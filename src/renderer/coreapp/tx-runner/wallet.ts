import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import { ReadOnlyWallet, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { stringToSolidityBytes } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { AddressValidation, newLedgerWalletWithSetup } from '@celo/wallet-ledger'
import { LocalWallet } from '@celo/wallet-local'

import { Account, MultiSigAccount } from '../../../lib/accounts/accounts'
import { decryptLocalKey } from '../../../lib/accounts/accountsdb'
import { UserError } from '../../../lib/error'
import { CFG } from '../../../lib/cfg'
import { spectronChainId } from '../../../lib/spectron-utils/constants'
import { Transaction } from '../../components/app-definition'
import { extractTXDestinationAndData } from './transaction-parser'
import { estimateGas } from './fee-estimation'

export interface Wallet {
	wallet: ReadOnlyWallet
	transformTX?: (kit: ContractKit, tx: Transaction) => Promise<Transaction>
	transport?: {close: () => void}
}

export async function createWallet(
	account: Account,
	accounts: Account[],
	password?: string): Promise<Wallet> {
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
			if (CFG().chainId !== spectronChainId) {
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
			return createMultiSigWallet(account, accounts, password)
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

const createMultiSigWallet = async (
	account: MultiSigAccount,
	accounts: Account[],
	password?: string): Promise<Wallet> => {
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
		const {destination, data} = extractTXDestinationAndData(tx)
		if (!destination) {
			throw new UserError(`MultiSig accounts can not deploy new contracts.`)
		}
		if (!data) {
			throw new Error(`Unexpected Error: Failed to parse transaction data.`)
		}
		const dataBytes = stringToSolidityBytes(data)
		const txo = multiSig.methods.submitTransaction(
			destination, tx.params?.value?.toString() || 0, dataBytes)
		// TODO(zviad): we need to figure out if there is need for additional logic for
		// GAS estimation. If the original transaction has GAS provided, should we somehow
		// take that into account for transformed TX?
		if (tx.tx === "eth_signTransaction" || tx.tx === "eth_sendTransaction") {
			const nonce = await kit.connection.nonce(owner.address)
			const estimatedGas = await estimateGas(kit, {tx: toTransactionObject(kit.connection, txo)})
			return {
				tx: tx.tx,
				params: {
					...tx.params,
					nonce: nonce,
					from: owner.address,
					to: account.address,
					data: txo.encodeABI(),
					value: "",
					gas: estimatedGas.toFixed(0),
				}
			}
		} else {
			return {tx: toTransactionObject(kit.connection, txo)}
		}
	}
	return {
		wallet: ownerWallet.wallet,
		transport: ownerWallet.transport,
		transformTX,
	}
}
