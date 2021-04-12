import { erc20Alfajores } from "./erc20/registry-alfajores"
import { erc20Baklava } from "./erc20/registry-baklava"
import { erc20Mainnet } from "./erc20/registry-mainnet"
import { erc20Devchain } from "./erc20/registry-devchain"
import { RegisteredErc20 } from "./erc20/core"
import { SpectronChainId } from "./spectron-utils/constants"

export const mainnetChainId = "42220"
const defaultChainId = mainnetChainId
const defaultAccountsDB = "home/.celoterminal/celoaccounts.db"

const defaultNetworks: {[key: string]: string} = {
	[mainnetChainId]: "https://forno.celo.org",
	"62320": "https://baklava-forno.celo-testnet.org",
	"44787": "https://alfajores-forno.celo-testnet.org",
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

const networkNames: {[key: string]: string} = {
	[mainnetChainId]: "Mainnet",
	"62320": "Baklava",
	"44787": "Alfajores",
}
export const networkName = (chainId: string): string => {
	return networkNames[chainId] || `ChainId: ${chainId}`
}

const erc20Registry: {[key: string]: RegisteredErc20[]} = {
	[mainnetChainId]: erc20Mainnet,
	"62320": erc20Baklava,
	"44787": erc20Alfajores,
	[SpectronChainId]: erc20Devchain,
}
export const registeredErc20s = (): RegisteredErc20[] => {
	return Array.from(erc20Registry[CFG().chainId] || [])
}

export const explorerRootURL = (): string => {
	switch (CFG().chainId) {
	case mainnetChainId:
		return "https://explorer.celo.org"
	case "62320":
		return "https://baklava-blockscout.celo-testnet.org"
	default:
		// just a fake URL.
		return `https://explorer.network.${CFG().chainId}`
	}
}
