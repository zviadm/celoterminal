import { erc20Baklava } from "./erc20-baklava";

export const CFG = {
	networkId: 62320,
	networkURL: "https://baklava-forno.celo-testnet.org",
	erc20s: [
		{name: "CELO"},
		{name: "cUSD"},
		...erc20Baklava],
	accountsDBDir: {
		root: "home" as const,
		path: [".celoterminal"],
	},
}