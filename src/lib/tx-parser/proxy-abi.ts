import { AbiItem } from "@celo/connect"

import PROXY_V1_JSON from "../core-contracts/Proxy-v1.json"
import PROXY_ERC1967_JSON from "../core-contracts/Proxy-ERC1967Upgrade.json"

export interface KnownProxy {
	verifiedName: string,
	abi: AbiItem[],
	bytecode: string, // Deployed bytecode.
	implementation: {
		type: "method",
		method: string,
	} | {
		type: "storage-slot",
		address: string,
	},
}

export const KnownProxies: KnownProxy[] = [
	{
		verifiedName: "CoreContract:Proxy",
		abi: PROXY_V1_JSON.abi as AbiItem[],
		bytecode: PROXY_V1_JSON.deployedBytecode,
		implementation: {
			type:"method", method: "_getImplementation",
		},
	},
	{
		verifiedName: "ERC1967UpgradableProxy",
		abi: PROXY_ERC1967_JSON.abi as AbiItem[],
		bytecode: PROXY_ERC1967_JSON.deployedBytecode,
		implementation: {
			type:"storage-slot", address: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
		},
	},
]
