import { erc20Baklava } from "./erc20-baklava"

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

const erc20Registry: {[key: string]: ERC20[]} = {
	"62320": erc20Baklava,
}

export type PathRoot = "home" | "userData"

interface ERC20 {
	name: string,
	address?: string,
}

interface Config {
	networkId: string,
	defaultNetworkURL: string,
	accountsDBPath: {
		root: PathRoot,
		path: string[],
	},
	erc20s: ERC20[],
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
			// TODO(zviadm): Predefined ERC20 lists for different networks.
			erc20s: [
				{name: "CELO"},
				{name: "cUSD"},
				...erc20s,
			],
		}
	}
	return _CFG
}

export const networkName = (networkId: string): string => {
	return networkNames[networkId] || `NetworkId: ${networkId}`
}