import { swappaRouterV1Address } from "@terminal-fi/swappa";

// List of manually verified contracts that are confirmed to indeed belong to a
// specific project. Contracts that ERC20 compatible should be placed in the ERC20 registry instead.
export const contractNamesRegistry: {
	name: string,
	addresses: {
		mainnet?: string,
		baklava?: string,
		alfajores?: string,
	},
}[] = [
	{
		// source: https://github.com/Ubeswap/ubeswap#deployed-contracts
		name: "Ubeswap:Router02",
		addresses: {
			mainnet: "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121",
			alfajores: "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121",
		},
	},
	{
		// source: https://github.com/terminal-fi/swappa/tree/main/tools/deployed
		name: "Swappa:RouterV1",
		addresses: {
			mainnet: swappaRouterV1Address,
		},
	},
]