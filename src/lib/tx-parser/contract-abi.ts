import axios, { AxiosInstance } from "axios"
import { AbiItem } from "web3-utils"
import { Address, ContractKit, RegisteredContracts } from '@celo/contractkit'

import { alfajoresChainId, baklavaChainId, CFG, mainnetChainId, registeredErc20s, selectAddress } from "../cfg"
import { deployedBytecode as multiSigBytecode, abi as multiSigAbi } from "../core-contracts/MultiSig.json"
import { KnownProxies, KnownProxy } from "./proxy-abi"
import { contractNamesRegistry } from "./registry"
import { ContractFactories } from "@celo/contractkit/lib/web3-contract-cache"

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
		let verifiedName: string | null = proxy.verifiedName
		if (implAddress !== "0x0000000000000000000000000000000000000000") {
			const implAbi = await fetchContractAbi(kit, implAddress)
			verifiedName = implAbi.verifiedName
			abi.push(...implAbi.abi)
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
			// if (abi === undefined) {
			// 	console.info(`core contracts wtf SER`)
			// 	console.info(`core contracts`, Object.keys(ContractFactories))
			// 	for (const coreContract of Object.keys(ContractFactories)) {
			// 		const c = await kit._web3Contracts.getContract(coreContract as keyof typeof ContractFactories)
			// 		console.info(`core contract addr`, coreContract, c.options.address)
			// 		if (c.options.address !== contractAddress) {
			// 			continue
			// 		}
			// 		verifiedName = `CoreContract:${coreContract}`
			// 		abi = c.options.jsonInterface
			// 		console.info(`core contract`, verifiedName, abi)
			// 	}
			// }
			if (verifiedName === undefined) {
				console.info(`contract: ${contractAddress}, verifying name...`)
				verifiedName = await verifiedContractName(kit, contractAddress)
				console.info(`contract: ${contractAddress}`, verifiedName)
			}
			if (abi === undefined || verifiedName === undefined) {
				throw new Error(`Contract source code is not verified.`)
			}
		}
		r = {verifiedName, abi}
	}
	console.info(`contract: ${contractAddress}`, r)
	contractCache.set(contractAddress, r)
	return r
}

export const verifiedContractName = async (
	kit: ContractKit,
	address: Address): Promise<string | null> => {
	console.info(`finding name 0...`)
	const registryAddresses = await Promise.all(
		await Promise.all(RegisteredContracts.map((r) => kit.registry.addressFor(r).catch(() => undefined))))
	const registryEntries: [string, string | undefined][] =
		RegisteredContracts.map((r, idx) => [r, registryAddresses[idx]])
	const match = registryEntries.find((i) => i[1]?.toLowerCase() === address.toLowerCase())
	if (match) {
		return `CoreContract:` + match[0]
	}
	console.info(`finding name 1...`)

	const erc20match = registeredErc20s.find((e) => e.address?.toLowerCase() === address.toLowerCase())
	if (erc20match) {
		return `${erc20match.name} (${erc20match.symbol})`
	}

	console.info(`finding name 2...`)
	const registryMatch = contractNamesRegistry.find(
		(c) => selectAddress(c.addresses)?.toLowerCase() === address.toLowerCase())
	if (registryMatch) {
		return registryMatch.name
	}

	return null
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
