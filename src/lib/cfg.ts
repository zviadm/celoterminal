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

export type PathRoot = "home" | "userData"

interface Config {
	networkId: string,
	defaultNetworkURL: string,
	accountsDBPath: {
		root: PathRoot,
		path: string[],
	},
	erc20s: {
		name: string,
		address?: string,
	}[],
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
			// TODO(zviadm): Predefined ERC20 lists for different networks.
			erc20s: [
				{name: "CELO"},
				{name: "cUSD"},
			],
		}
	}
	return _CFG
}

export const networkName = (networkId: string): string => {
	return networkNames[networkId] || `NetworkId: ${networkId}`
}