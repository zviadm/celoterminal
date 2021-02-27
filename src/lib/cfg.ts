import { erc20Alfajores } from "./erc20/registry-alfajores"
import { erc20Baklava } from "./erc20/registry-baklava"
import { erc20Mainnet } from "./erc20/registry-mainnet"
import { RegisteredErc20 } from "./erc20/core"

export const mainnetNetworkId = "42220"
const defaultNetworkId = mainnetNetworkId
const defaultAccountsDB = "home/.celoterminal/celoaccounts.db"

const defaultNetworks: {[key: string]: string} = {
	[mainnetNetworkId]: "https://forno.celo.org",
	"62320": "https://baklava-forno.celo-testnet.org",
	"44787": "https://alfajores-forno.celo-testnet.org",
}
const fallbackNetworkURL = "http://localhost:7545"

export type PathRoot = "home" | "userData"

interface Config {
	networkId: string,
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
		const networkId =
			process.env["CELOTERMINAL_NETWORK_ID"] ||
			defaultNetworkId
		const defaultNetworkURL =
			process.env["CELOTERMINAL_NETWORK_URL"] ||
			defaultNetworks[networkId] ||
			fallbackNetworkURL
		const accountsDBPath =
			process.env["CELOTERMINAL_ACCOUNTS_DB"] ||
			defaultAccountsDB
		const accountsDBPathParts = accountsDBPath.split("/")

		_CFG = {
			networkId,
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
	[mainnetNetworkId]: "Mainnet",
	"62320": "Baklava",
	"44787": "Alfajores",
}
export const networkName = (networkId: string): string => {
	return networkNames[networkId] || `NetworkId: ${networkId}`
}

const erc20Registry: {[key: string]: RegisteredErc20[]} = {
	[mainnetNetworkId]: erc20Mainnet,
	"62320": erc20Baklava,
	"44784": erc20Alfajores,
}
export const registeredErc20s = (): RegisteredErc20[] => {
	return Array.from(erc20Registry[CFG().networkId] || [])
}

export const explorerRootURL = (): string => {
	switch (CFG().networkId) {
	case mainnetNetworkId:
		return "https://explorer.celo.org"
	case "62320":
		return "https://baklava-blockscout.celo-testnet.org"
	default:
		// just a fake URL.
		return `https://explorer.network.${CFG().networkId}`
	}
}
