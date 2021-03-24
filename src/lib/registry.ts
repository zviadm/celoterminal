import { Address } from "@celo/connect"
import { ContractKit, RegisteredContracts } from "@celo/contractkit"
import { registeredErc20s } from "./cfg"
import { fmtAddress } from "./utils"

export const contractName = async (
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