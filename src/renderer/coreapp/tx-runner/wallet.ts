import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import { ReadOnlyWallet, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { stringToSolidityBytes } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { AddressValidation, newLedgerWalletWithSetup } from '@celo/wallet-ledger'
import { LocalWallet } from '@celo/wallet-local'

import { Account, MultiSigAccount } from '../../../lib/accounts/accounts'
import { decryptLocalKey } from '../../../lib/accounts/accountsdb'
import { UserError } from '../../../lib/error'
import { CFG, e2eTestChainId } from '../../../lib/cfg'
import { SignatureRequest } from '../../components/app-definition'
import { extractTXDestinationAndData } from './transaction-parser'
import { estimateGas } from './fee-estimation'

export interface Wallet {
	wallet: ReadOnlyWallet
	transformReq?: (kit: ContractKit, req: SignatureRequest) => Promise<SignatureRequest>
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
			if (CFG().chainId !== e2eTestChainId) {
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
	const transformReq = async (kit: ContractKit, req: SignatureRequest): Promise<SignatureRequest> => {
		const multiSig = await kit._web3Contracts.getMultiSig(account.address)
		if (ownerWallet.transformReq) {
			req = await ownerWallet.transformReq(kit, {
				...req,
				executeUsingParentAccount: false,
			})
		}
		if (req.executeUsingParentAccount) {
			return req
		}
		if (req.type !== undefined) {
			throw new UserError(`MultiSig accounts can only send and sign transactions.`)
		}
		const {destination, data} = extractTXDestinationAndData(req)
		if (!destination) {
			throw new UserError(`MultiSig accounts can not deploy new contracts.`)
		}
		if (!data) {
			throw new Error(`Unexpected Error: Failed to parse transaction data.`)
		}
		const dataBytes = stringToSolidityBytes(data)
		const txo = multiSig.methods.submitTransaction(
			destination, req.params?.value?.toString() || 0, dataBytes)
		// TODO(zviad): we need to figure out if there is need for additional logic for
		// GAS estimation. If the original transaction has GAS provided, should we somehow
		// take that into account for transformed TX?
		if (req.tx === "eth_signTransaction" || req.tx === "eth_sendTransaction") {
			const nonce = await kit.connection.nonce(owner.address)
			const estimatedGas = await estimateGas(kit, {tx: toTransactionObject(kit.connection, txo)})
			return {
				type: req.type,
				tx: req.tx,
				params: {
					...req.params,
					nonce: nonce,
					from: owner.address,
					to: account.address,
					data: txo.encodeABI(),
					value: "",
					gas: estimatedGas.toFixed(0),
				}
			}
		} else {
			return {type: req.type, tx: toTransactionObject(kit.connection, txo)}
		}
	}
	return {
		wallet: ownerWallet.wallet,
		transport: ownerWallet.transport,
		transformReq,
	}
}
