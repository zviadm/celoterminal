import * as React from "react"
import * as log from "electron-log"
import { CFG, cmpErc20ASC, registeredErc20s } from "../../lib/cfg"
import { coreErc20s, RegisteredErc20 } from "../../lib/erc20/core"

// useErc20List returns users watched/added list of Erc20 tokens.
// reload can be used to refresh the list. reload should be called after token
// gets added or removed.
export const useErc20List = (): {
	erc20s: RegisteredErc20[],
	reload: () => void,
} => {
	const [changeN, setChangeN] = React.useState(0)
	const erc20s = React.useMemo(() => {
		const registered = (registeredList()
			.map((r) => registeredErc20s.find((f) => f.address === r.address))
			.filter((v) => (v !== undefined)) as RegisteredErc20[])
		const custom = customList()
		const sorted = [
			...registered,
			...custom,
		].sort(cmpErc20ASC)
		return [
			...coreErc20s,
			...sorted,
		]
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [changeN])
	const reload = () => { setChangeN((n) => n + 1) }
	return {
		erc20s,
		reload,
	}
}

// Adds new RegisteredErc20 to the list. This function should generally be used
// through `AddErc20` component.
export const addRegisteredErc20 = (symbol: string): RegisteredErc20 => {
	const erc20 = registeredErc20s.find((r) => r.symbol === symbol)
	if (!erc20 || !erc20.address) {
		throw new Error(`Erc20: ${symbol} not found in registry.`)
	}
	const list = registeredList()
	const match = list.find((l) => l.address.toLowerCase() === erc20.address?.toLowerCase())
	if (match) {
		return erc20
	}
	// Remove, in-case this erc20 address was somehow added in to the customList before.
	removeErc20FromList(erc20.address)
	list.push({address: erc20.address})
	setRegisteredList(list)
	return erc20
}

export interface CustomErc20 {
	name: string
	symbol: string
	address: string
	decimals: number
}

// Adds new custom ERC20 to the list. This function should generally be used
// through `AddErc20` component.
export const addCustomErc20 = (erc20: CustomErc20): RegisteredErc20 => {
	const registeredErc20 = registeredErc20s.find((r) => r.address?.toLowerCase() === erc20.address.toLowerCase())
	if (registeredErc20) {
		return addRegisteredErc20(registeredErc20.symbol)
	}
	const list = customList()
	const symbolConflict =
		registeredErc20s.find((r) => r.symbol === erc20.symbol) ||
		list.find((r) => r.symbol === erc20.symbol && r.address !== erc20.address)
	if (symbolConflict) {
		erc20 = {
			...erc20,
			symbol: `${erc20.symbol}-${erc20.address.substr(0, 6)}`,
		}
	}
	const matchIdx = list.findIndex((l) => l.address.toLowerCase() === erc20.address)
	if (matchIdx > -1) {
		list.splice(matchIdx, 1, erc20)
	} else {
		list.push(erc20)
	}
	setCustomList(list)
	return erc20
}

// Removes ERC20 from the list. This function should be used through `RemoveErc20`
// component.
export const removeErc20FromList = (address: string): void => {
	const rList = registeredList()
	const rListFiltered = rList.filter((r) => r.address !== address)
	if (rListFiltered.length !== rList.length) {
		setRegisteredList(rListFiltered)
	}
	const cList = customList()
	const cListFiltered = cList.filter((r) => r.address !== address)
	if (cListFiltered.length !== cList.length) {
		setCustomList(cListFiltered)
	}
}

const registeredListKeyPrefix = "terminal/core/erc20/registered-list/"
const registeredList = (): {address: string}[] => {
	const registeredListKey = registeredListKeyPrefix + CFG().chainId
	const json = localStorage.getItem(registeredListKey)
	if (!json) {
		return []
	}
	try {
		return JSON.parse(json)
	} catch (e) {
		log.error(`erc20: failed to parse: ${registeredListKey} - ${json}`)
		return []
	}
}
const setRegisteredList = (list: {address: string}[]) => {
	const registeredListKey = registeredListKeyPrefix + CFG().chainId
	localStorage.setItem(registeredListKey, JSON.stringify(list))
}

const customListKeyPrefix = "terminal/core/erc20/custom-list/"
const customList = (): CustomErc20[] => {
	const customListKey = customListKeyPrefix + CFG().chainId
	const json = localStorage.getItem(customListKey)
	if (!json) {
		return []
	}
	try {
		return JSON.parse(json)
	} catch (e) {
		log.error(`erc20: failed to parse: ${customListKey} - ${json}`)
		return []
	}
}
const setCustomList = (list: CustomErc20[]) => {
	const customListKey = customListKeyPrefix + CFG().chainId
	localStorage.setItem(customListKey, JSON.stringify(list))
}