import { AbiItem } from "web3-utils"

import { deployedBytecode as proxyBytecodeV1, abi as proxyAbiV1 } from "../core-contracts/Proxy-v1.json"
import { deployedBytecode as proxyBytecodeBrokerV1, abi as proxyAbiBrokerV1 } from "../core-contracts/BrokerProxy-v1.json"
import { deployedBytecode as proxyBytecodeERC1967Upgrade, abi as proxyAbiERC1967Upgrade } from "../core-contracts/Proxy-ERC1967Upgrade.json"

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
		abi: proxyAbiV1 as AbiItem[],
		bytecode: proxyBytecodeV1,
		implementation: {
			type:"method", method: "_getImplementation",
		},
	},
	{
		verifiedName: "Mento:BrokerProxy",
		abi: proxyAbiBrokerV1 as AbiItem[],
		bytecode: proxyBytecodeBrokerV1,
		implementation: {
			type:"method", method: "_getImplementation",
		},
	},
	{
		verifiedName: "ERC1967UpgradableProxy",
		abi: proxyAbiERC1967Upgrade as AbiItem[],
		bytecode: proxyBytecodeERC1967Upgrade,
		implementation: {
			type:"storage-slot", address: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
		},
	},
]
