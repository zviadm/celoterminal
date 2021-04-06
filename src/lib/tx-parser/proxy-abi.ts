import { AbiItem } from "web3-utils"

import { deployedBytecode as proxyBytecode, abi as proxyAbi } from "../core-contracts/Proxy.json"

export interface KnownProxy {
	verifiedName: string,
	abi: AbiItem[],
	bytecode: string, // Deployed bytecode.
	implementationMethod: string,
}

export const KnownProxies: KnownProxy[] = [
	{
		verifiedName: "CoreContract:Proxy",
		abi: proxyAbi as AbiItem[],
		bytecode: proxyBytecode,
		implementationMethod: "_getImplementation",
	},
]
