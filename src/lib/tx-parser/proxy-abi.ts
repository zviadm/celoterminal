import { AbiItem } from "web3-utils"

import { deployedBytecode as proxyBytecodeV1, abi as proxyAbiV1 } from "../core-contracts/Proxy-v1.json"
import * as proxyAbiGovMultiSig from "../core-contracts/Proxy-GovMultiSig.json"
import { deployedBytecode as proxyBytecodeGovMultiSig } from "../core-contracts/Proxy-GovMultiSig-bytecode.json"

export interface KnownProxy {
	verifiedName: string,
	abi: AbiItem[],
	bytecode: string, // Deployed bytecode.
	implementationMethod: string,
}

export const KnownProxies: KnownProxy[] = [
	{
		verifiedName: "CoreContract:Proxy",
		abi: proxyAbiV1 as AbiItem[],
		bytecode: proxyBytecodeV1,
		implementationMethod: "_getImplementation",
	},
	{
		verifiedName: "CoreContract:GovMultiSigProxy",
		abi: proxyAbiGovMultiSig as AbiItem[],
		bytecode: proxyBytecodeGovMultiSig,
		implementationMethod: "_getImplementation",
	},
]
