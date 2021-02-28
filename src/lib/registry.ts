import { Address } from "@celo/connect"
import { ContractKit } from "@celo/contractkit"
import { registeredErc20s } from "./cfg"
import { fmtAddress } from "./utils"

export const contractName = async (
	kit: ContractKit,
	address: Address): Promise<string> => {
	const addressMapping = await kit.registry.addressMapping()
	const match = Array.from(
		addressMapping.entries()).find((i) => i[1].toLowerCase() === address.toLowerCase())
	if (match) {
		return `CoreContract:` + match[0]
	}

	const registeredList = registeredErc20s()
	const erc20match = registeredList.find((e) => e.address?.toLowerCase() === address.toLowerCase())
	if (erc20match) {
		return erc20match.fullName
	}

	return fmtAddress(address)
}