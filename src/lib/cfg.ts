import { erc20Registry } from "./erc20/registry"
import { erc20Devchain } from "./erc20/registry-devchain"
import { RegisteredErc20 } from "./erc20/core"
import { spectronChainId } from "./spectron-utils/constants"

import FORNO_KEY_JSON from "./forno.key.json"
export const FORNO_API_KEY = FORNO_KEY_JSON.API_KEY

export const mainnetChainId = "42220"
export const baklavaChainId = "62320"
export const alfajoresChainId = "44787"
const defaultChainId = mainnetChainId
const defaultAccountsDB = "home/.celoterminal/celoaccounts.db"

export const FORNO_MAINNET_URL = "https://forno.celo.org"
const defaultNetworks: {[key: string]: string} = {
	[mainnetChainId]: FORNO_MAINNET_URL,
	[baklavaChainId]: "https://baklava-forno.celo-testnet.org",
	[alfajoresChainId]: "https://alfajores-forno.celo-testnet.org",
}
const fallbackNetworkURL = "http://localhost:7545"

export type PathRoot = "home" | "userData"

interface Config {
	chainId: string,
	defaultNetworkURL: string,
	accountsDBPath: {
		root: PathRoot,
		path: string[],
	},
}

let _CFG: Config
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const CFG = (): Config => {
	if (!_CFG) {
		const chainId =
			process.env["CELOTERMINAL_NETWORK_ID"] ||
			defaultChainId
		const defaultNetworkURL =
			process.env["CELOTERMINAL_NETWORK_URL"] ||
			defaultNetworks[chainId] ||
			fallbackNetworkURL
		const accountsDBPath =
			process.env["CELOTERMINAL_ACCOUNTS_DB"] ||
			defaultAccountsDB
		const accountsDBPathParts = accountsDBPath.split("/")

		_CFG = {
			chainId: chainId,
			defaultNetworkURL,
			accountsDBPath: {
				root: accountsDBPathParts[0] as PathRoot,
				path: accountsDBPathParts.slice(1),
			},
		}
	}
	return _CFG
}

export const selectAddress = (addresses: {[chainId: string]: string}): string | null => {
	let address: string | null = addresses[CFG().chainId]
	if (!address) {
		address =
			CFG().chainId === mainnetChainId ? addresses.mainnet :
			CFG().chainId === baklavaChainId ? addresses.baklava :
			CFG().chainId === alfajoresChainId ? addresses.alfajores :
			null
	}
	return address
}

export const selectAddressOrThrow = (addresses: {[chainId: string]: string}): string => {
	const address = selectAddress(addresses)
	if (!address) {
		throw new Error(`No address found for chainId: ${CFG().chainId}!`)
	}
	return address
}

const networkNames: {[key: string]: string} = {
	[mainnetChainId]: "Mainnet",
	[baklavaChainId]: "Baklava",
	[alfajoresChainId]: "Alfajores",
}
export const networkName = (chainId: string): string => {
	return networkNames[chainId] || `ChainId: ${chainId}`
}

export const cmpErc20ASC = (a: RegisteredErc20, b: RegisteredErc20): number => {
	const isLowerA = a.symbol[0] === a.symbol[0].toLowerCase()
	const isLowerB = b.symbol[0] === b.symbol[0].toLowerCase()
	return (
		isLowerA && !isLowerB ? -1 :
		!isLowerA && isLowerB ? 1 :
		a.symbol < b.symbol ? -1 : 1
	)
}
const _registeredErc20s = (): RegisteredErc20[] => {
	const chainId = CFG().chainId
	switch (chainId) {
	case spectronChainId:
		return erc20Devchain
	default:
		return erc20Registry.map((e) => ({
			name: e.name,
			symbol: e.symbol,
			decimals: e.decimals,
			conversion: e.conversion,
			address: selectAddress(e.addresses) || undefined,
		}))
		.filter((e) => e.address !== undefined)
		.sort(cmpErc20ASC)
	}
}
export const registeredErc20s = _registeredErc20s()

export const explorerRootURL = (): string => {
	switch (CFG().chainId) {
	case mainnetChainId:
		return "https://celoscan.io"
	case alfajoresChainId:
		return "https://alfajores.celoscan.io"
	default:
		// just a fake URL.
		return `https://explorer.network.${CFG().chainId}`
	}
}
