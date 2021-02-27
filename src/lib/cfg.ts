import { erc20Alfajores } from "./erc20/registry-alfajores"
import { erc20Baklava } from "./erc20/registry-baklava"
import { erc20Mainnet } from "./erc20/registry-mainnet"
import { coreErc20s, RegisteredERC20 } from "./erc20/core"

export const mainnetNetworkId = "42220"
const defaultNetworkId = mainnetNetworkId
const defaultAccountsDB = "home/.celoterminal/celoaccounts.db"

const defaultNetworks: {[key: string]: string} = {
	[mainnetNetworkId]: "https://forno.celo.org",
	"62320": "https://baklava-forno.celo-testnet.org",
	"44787": "https://alfajores-forno.celo-testnet.org",
}
const fallbackNetworkURL = "http://localhost:7545"

const networkNames: {[key: string]: string} = {
	[mainnetNetworkId]: "Mainnet",
	"62320": "Baklava",
	"44787": "Alfajores",
}

const erc20Registry: {[key: string]: RegisteredERC20[]} = {
	[mainnetNetworkId]: erc20Mainnet,
	"62320": erc20Baklava,
	"44784": erc20Alfajores,
}

export type PathRoot = "home" | "userData"

interface Config {
	networkId: string,
	defaultNetworkURL: string,
	accountsDBPath: {
		root: PathRoot,
		path: string[],
	},
	erc20s: RegisteredERC20[],
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

		const erc20s = Array.from((erc20Registry[networkId] || [])).sort((a, b) => a.name < b.name ? -1 : 1)
		_CFG = {
			networkId,
			defaultNetworkURL,
			accountsDBPath: {
				root: accountsDBPathParts[0] as PathRoot,
				path: accountsDBPathParts.slice(1),
			},
			erc20s: [
				...coreErc20s,
				...erc20s,
			],
		}
	}
	return _CFG
}

export const networkName = (networkId: string): string => {
	return networkNames[networkId] || `NetworkId: ${networkId}`
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