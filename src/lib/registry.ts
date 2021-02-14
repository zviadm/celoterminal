import { Address } from "@celo/connect"
import { ContractKit } from "@celo/contractkit"
import { CFG } from "./cfg"
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

	const cfg = CFG()
	const erc20match = cfg.erc20s.find((e) => e.address?.toLowerCase() === address.toLowerCase())
	if (erc20match) {
		return erc20match.name
	}
	return fmtAddress(address)
}