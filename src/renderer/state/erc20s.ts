import { registeredErc20s } from "../../lib/cfg"
import { RegisteredERC20 } from "../../lib/erc20/core"

const registeredListKey = "terminal/core/erc20/registered-list"
const customListKey = "terminal/core/erc20/custom-list"

export const erc20List = (): RegisteredERC20[] => {
	// Get core erc20s.
	// Get registered-list.
	// Get Custom added erc20s.
}

export const addCustomErc20 = (erc20: string, address: string) => {
	const registeredList = registeredErc20s()
	const registeredErc20 = registeredList.find((r) => r.address.toLowerCase() === address.toLowerCase())
	if (registeredErc20) {
		return addRegisteredErc20(registeredErc20.name)
	}
	// TODO(zviad): add it to the custom list
}

export const addRegisteredErc20 = (erc20name: string) => {
	const registeredList = registeredErc20s()
	const erc20 = registeredList.find((r) => r.name === erc20name)
	if (!erc20) {
		throw new Error(`Erc20: ${erc20name} not found in registry.`)
	}
}