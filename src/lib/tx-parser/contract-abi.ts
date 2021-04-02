import axios, { AxiosInstance } from "axios"
import { AbiItem } from "web3-utils"
import { Address, ContractKit, PROXY_ABI, RegisteredContracts } from '@celo/contractkit'

import { CFG, registeredErc20s } from "../cfg"
import { deployedBytecode as proxyBytecode, abi as proxyAbi } from "../core-contracts/Proxy.json"
import { deployedBytecode as multiSigBytecode, abi as multiSigAbi } from "../core-contracts/MultiSig.json"
import { fmtAddress } from '../utils'

const builtinContracts: {
	name: string,
	abi: AbiItem[],
	bytecode: string,
}[] = [
	{
		name: "CoreContract:Proxy",
		abi: proxyAbi as AbiItem[],
		bytecode: proxyBytecode,
	},
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
	// User readable contractName is only available for contracts that are somehow verified to
	// be authentic. This is different from source verification, because same source code can
	// be deployed and verified at different addresses.
	contractName: string
	isProxy: boolean
	abi: AbiItem[]
}

// TODO(zviad): cache should be bounded in size.
const contractCache = new Map<string, ContractABI>()

export const fetchContractAbi = async (kit: ContractKit, contractAddress: string): Promise<ContractABI> => {
	const cached = contractCache.get(contractAddress)
	if (cached !== undefined) {
		return cached
	}

	const code = await kit.web3.eth.getCode(contractAddress)
	const isProxy = code === proxyBytecode
	let implAddress = contractAddress
	let implCode = code
	if (isProxy) {
		const proxyWeb3Contract = new kit.web3.eth.Contract(PROXY_ABI, contractAddress)
		implAddress = await proxyWeb3Contract.methods._getImplementation().call()
		implCode = await kit.web3.eth.getCode(implAddress)
	}

	let abi
	let contractName
	const builtin = builtinContracts.find((c) => c.bytecode === implCode)
	if (builtin) {
		abi = builtin.abi
		contractName = `${builtin.name} (${fmtAddress(contractAddress)})`
	} else {
		const url = `/contracts/full_match/${CFG().chainId}/${implAddress}/metadata.json`
		const resp = await cli().get(url, {
			validateStatus: (status) => status === 200 || status === 404,
		})
		if (resp.status === 404) {
			throw new Error(`Contract source code is not verified.`)
		}
		abi = JSON.parse(resp.data)["output"]["abi"] as AbiItem[]
		contractName = await verifiedContractName(kit, contractAddress)
	}

	if (isProxy) {
		abi.push(...(proxyAbi as AbiItem[]))
	}
	const r = {contractName, isProxy, abi}
	contractCache.set(contractAddress, r)
	return r
}

export const verifiedContractName = async (
	kit: ContractKit,
	address: Address): Promise<string> => {
	const registry = await kit.registry
	const registryAddresses = await Promise.all(
		await Promise.all(RegisteredContracts.map((r) => registry.addressFor(r).catch(() => undefined))))
	const registryEntries: [string, string | undefined][] =
		RegisteredContracts.map((r, idx) => [r, registryAddresses[idx]])
	const match = registryEntries.find((i) => i[1]?.toLowerCase() === address.toLowerCase())
	if (match) {
		return `CoreContract:` + match[0]
	}

	const registeredList = registeredErc20s()
	const erc20match = registeredList.find((e) => e.address?.toLowerCase() === address.toLowerCase())
	if (erc20match) {
		return `${erc20match.name} (${erc20match.symbol})`
	}

	return fmtAddress(address)
}