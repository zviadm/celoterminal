import axios, { AxiosInstance } from "axios"
import { AbiItem } from "web3-utils"
import { Address, ContractKit, RegisteredContracts } from '@celo/contractkit'

import { alfajoresChainId, baklavaChainId, CFG, mainnetChainId, registeredErc20s } from "../cfg"
import { deployedBytecode as multiSigBytecode, abi as multiSigAbi } from "../core-contracts/MultiSig.json"
import { KnownProxies, KnownProxy } from "./proxy-abi"

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

	let code: string | undefined
	let proxy: KnownProxy | undefined = cached?.proxy
	if (!cached) {
		code = await kit.web3.eth.getCode(contractAddress)
		proxy = KnownProxies.find((p) => p.bytecode === code)
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
		const builtin = builtinContracts.find((c) => c.bytecode === code)
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
					validateStatus: (status) => status === 200 || status === 404,
					responseType: "json",
				})
				if (resp.status === 404) {
					continue
				}
				abi = resp.data.output.abi as AbiItem[]
				verifiedName = await verifiedContractName(kit, contractAddress)
				break
			}
			if (abi === undefined || verifiedName === undefined) {
				throw new Error(`Contract source code is not verified.`)
			}
		}
		r = {verifiedName, abi}
	}
	contractCache.set(contractAddress, r)
	return r
}

export const verifiedContractName = async (
	kit: ContractKit,
	address: Address): Promise<string | null> => {
	const registry = await kit.registry
	const registryAddresses = await Promise.all(
		await Promise.all(RegisteredContracts.map((r) => registry.addressFor(r).catch(() => undefined))))
	const registryEntries: [string, string | undefined][] =
		RegisteredContracts.map((r, idx) => [r, registryAddresses[idx]])
	const match = registryEntries.find((i) => i[1]?.toLowerCase() === address.toLowerCase())
	if (match) {
		return `CoreContract:` + match[0]
	}

	const erc20match = registeredErc20s.find((e) => e.address?.toLowerCase() === address.toLowerCase())
	if (erc20match) {
		return `${erc20match.name} (${erc20match.symbol})`
	}

	return null
}
