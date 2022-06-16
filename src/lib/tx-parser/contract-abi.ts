import axios, { AxiosInstance } from "axios"
import { AbiItem } from "web3-utils"
import { Address, CeloContract, ContractKit } from '@celo/contractkit'
import * as log from "electron-log"

import {
	alfajoresChainId, baklavaChainId, CFG, mainnetChainId,
	registeredErc20s, explorerRootURL, selectAddress
} from "../cfg"
import { deployedBytecode as multiSigBytecode, abi as multiSigAbi } from "../core-contracts/MultiSig.json"
import { KnownProxies, KnownProxy } from "./proxy-abi"
import { contractNamesRegistry } from "./registry"
import { toChecksumAddress } from "ethereumjs-util"

const builtinContracts: {
	name: string,
	abi: AbiItem[],
	bytecode: string,
}[] = [
	{
		name: "CoreContract:MultiSig",
		abi: multiSigAbi as AbiItem[],
		bytecode: multiSigBytecode,
	},
]

const sourcifyRoot = `https://repo.sourcify.dev`

let _client: AxiosInstance
const cli = () => {
	if (!_client) {
		_client = axios.create({baseURL: sourcifyRoot, timeout: 3000})
	}
	return _client
}

let _explorerClient: AxiosInstance
const explorerCli = () => {
	if (!_explorerClient) {
		_explorerClient = axios.create({baseURL: `${explorerRootURL()}`, timeout: 3000})
	}
	return _explorerClient
}

export interface ContractABI {
	// User readable verifiedName is only available for contracts that are somehow verified to
	// be authentic. This is different from source verification, because same source code can
	// be deployed and verified at different addresses.
	verifiedName: string | null
	proxy?: KnownProxy
	abi: AbiItem[]
}

// TODO(zviad): cache should be bounded in size.
const contractCache = new Map<string, ContractABI>()

export const fetchContractAbi = async (kit: ContractKit, contractAddress: string): Promise<ContractABI> => {
	contractAddress = toChecksumAddress(contractAddress)
	const cached = contractCache.get(contractAddress)
	if (cached !== undefined && !cached.proxy) {
		return cached
	}

	let codeStripped: string | undefined
	let proxy: KnownProxy | undefined = cached?.proxy
	if (!cached) {
		const code = await kit.web3.eth.getCode(contractAddress)
		codeStripped = stripMetadataFromBytecode(code)
		proxy = KnownProxies.find((p) => stripMetadataFromBytecode(p.bytecode) === codeStripped)
	}
	let r
	if (proxy) {
		const proxyWeb3Contract = new kit.web3.eth.Contract(proxy.abi, contractAddress)
		const implAddress = await proxyWeb3Contract.methods[proxy.implementationMethod]().call()
		const abi = [...proxy.abi]
		let verifiedName = await verifiedContractName(kit, contractAddress)
		if (implAddress !== "0x0000000000000000000000000000000000000000") {
			const implAbi = await fetchContractAbi(kit, implAddress)
			abi.push(...implAbi.abi)
			if (verifiedName === undefined && implAbi.verifiedName !== undefined) {
				verifiedName = implAbi.verifiedName
			}
		}
		if (verifiedName === undefined) {
			verifiedName = proxy.verifiedName
		}
		r = {verifiedName, proxy, abi}
	} else {
		const builtin = builtinContracts.find((c) => stripMetadataFromBytecode(c.bytecode) === codeStripped)
		let abi
		let verifiedName
		if (builtin) {
			abi = builtin.abi
			verifiedName = builtin.name
		} else {
			const chainId = CFG().chainId
			if (chainId !== mainnetChainId &&
				chainId !== baklavaChainId &&
				chainId !== alfajoresChainId) {
				throw new Error(`Contract verification not supported on ChainId: ${chainId}.`)
			}
			for (const match of ["full_match", "partial_match"]) {
				const url = `/contracts/${match}/${chainId}/${contractAddress}/metadata.json`
				const resp = await cli().get(url, {
					validateStatus: (status) => (status === 200 || status === 404),
					responseType: "json",
				})
				if (resp.status === 404) {
					continue
				}
				abi = resp.data.output.abi as AbiItem[]
				break
			}
			if (abi === undefined) {
				// Fallback to checking if contract is verified on celoscan.xyz.
				// NOTE: celoscan.xyz API key is hardcoded here but this is a non issue since this API key
				// is only used for rate limiting.
				const resp = await explorerCli().get<{
						message: string,
						result: string,
					}>(`https://api.celoscan.xyz/api?module=contract&action=getabi&address=${contractAddress}&apikey=G3VEE5GFKX7WEBGBAPKQCUS4DFJB1HMQR6`)
				if (resp.data.message.toLowerCase() === "ok") {
					abi = JSON.parse(resp.data.result) as AbiItem[]
				} else {
					log.warn(`celoscan: ${contractAddress} not found ${resp.data.message}`)
				}
			}
			if (abi === undefined) {
				throw new Error(`Contract source code is not verified.`)
			}
			verifiedName = await verifiedContractName(kit, contractAddress)
		}
		r = {verifiedName, abi}
	}
	contractCache.set(contractAddress, r)
	return r
}

let _coreRegistry = new Map<string, CeloContract>()

export const verifiedContractName = async (
	kit: ContractKit,
	address: Address): Promise<string | null> => {
	address = toChecksumAddress(address)
	if (_coreRegistry.size === 0) {
		const registryMapping = await kit.registry.addressMapping()
		_coreRegistry = new Map(
			Array.from(registryMapping.entries()).map(([contract, address]) => [address, contract])
		)
	}
	const coreMatch = _coreRegistry.get(address)
	if (coreMatch) {
		return `CoreContract:${coreMatch}`
	}

	const erc20match = registeredErc20s.find((e) => e.address === address)
	if (erc20match) {
		return `${erc20match.name} (${erc20match.symbol})`
	}

	const registryMatch = contractNamesRegistry.find((c) => selectAddress(c.addresses) === address)
	if (registryMatch) {
		return registryMatch.name
	}
	return null
}

export const contractNamesByAddress = async (kit: ContractKit, addresses: string[]): Promise<Map<string, string>> => {
	const addressSet = Array.from(new Set(addresses).values())
	const verifiedNames = await Promise.all(addressSet.map((a) => verifiedContractName(kit, a)))
	const mapping = new Map<string, string>()
	verifiedNames.forEach((name, idx) => {
		if (!name) {
			return
		}
		mapping.set(addressSet[idx], name)
	})
	return mapping
}

export const stripMetadataFromBytecode = (bytecode: string): string => {
	// Docs:
	// https://docs.soliditylang.org/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
	// Metadata format has changed once, but can be detected using last two bytes.
	switch (bytecode.substring(bytecode.length - 4)) {
	case '0029':
		// Format: 0xa1 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes of swarm> 0x00 0x29
		return bytecode.substring(0, bytecode.length - 43 * 2)
	case '0032':
		// Format:
		// 0xa2 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes of swarm>
		// 0x64 's' 'o' 'l' 'c' 0x43 <3 byte version encoding>
		// 0x00 0x32
		return bytecode.substring(0, bytecode.length - 52 * 2)
	default:
		return bytecode
	}
}
