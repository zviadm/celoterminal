import * as React from "react"
import * as log from "electron-log"
import { registeredErc20s } from "../../lib/cfg"
import { coreErc20Decimals, coreErc20s, RegisteredErc20 } from "../../lib/erc20/core"

// useErc20List returns users watched/added list of Erc20 tokens.
// reload can be used to refresh the list. reload should be called after token
// gets added or removed.
export const useErc20List = (): {
	erc20s: RegisteredErc20[],
	reload: () => void,
} => {
	const [changeN, setChangeN] = React.useState(0)
	const erc20s = React.useMemo(() => {
		const core: RegisteredErc20[] = coreErc20s.map((e) => ({
			fullName: e,
			address: "",
			decimals: coreErc20Decimals,
		}))
		const fullList = registeredErc20s()
		const registered = (registeredList()
			.map((r) => fullList.find((f) => f.address === r.address))
			.filter((v) => (v !== undefined)) as RegisteredErc20[])
			.sort((a, b) => a.fullName < b.fullName ? -1 : 1)
		const custom = customList()
			.map((c) => customToErc20(c))
			.sort((a, b) => a.fullName < b.fullName ? -1 : 1)
		return [
			...core,
			...registered,
			...custom,
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
export const addRegisteredErc20 = (fullName: string): RegisteredErc20 => {
	const fullList = registeredErc20s()
	const erc20 = fullList.find((r) => r.fullName === fullName)
	if (!erc20) {
		throw new Error(`Erc20: ${fullName} not found in registry.`)
	}
	const list = registeredList()
	const match = list.find((l) => l.address.toLowerCase() === erc20.address.toLowerCase())
	if (match) {
		return erc20
	}
	list.push({address: erc20.address})
	setRegisteredList(list)
	return erc20
}

export interface CustomErc20 {
	symbol: string
	address: string
	decimals: number
}

// Adds new custom ERC20 to the list. This function should generally be used
// through `AddErc20` component.
export const addCustomErc20 = (erc20: CustomErc20): RegisteredErc20 => {
	const fullList = registeredErc20s()
	const registeredErc20 = fullList.find((r) => r.address.toLowerCase() === erc20.address.toLowerCase())
	if (registeredErc20) {
		return addRegisteredErc20(registeredErc20.fullName)
	}
	const list = customList()
	const matchIdx = list.findIndex((l) => l.address.toLowerCase() === erc20.address)
	if (matchIdx >= -1) {
		list.splice(matchIdx, 1, erc20)
	} else {
		list.push(erc20)
	}
	setCustomList(list)
	return customToErc20(erc20)
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

const registeredListKey = "terminal/core/erc20/registered-list"
const registeredList = (): {address: string}[] => {
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
	localStorage.setItem(registeredListKey, JSON.stringify(list))
}

const customListKey = "terminal/core/erc20/custom-list"
const customList = (): CustomErc20[] => {
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
	localStorage.setItem(customListKey, JSON.stringify(list))
}
const customToErc20 = (erc20: CustomErc20): RegisteredErc20 => {
	return {
		fullName: "Custom:" + erc20.symbol,
		address: erc20.address,
		decimals: erc20.decimals,
	}
}