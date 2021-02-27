import * as React from "react"
import * as log from "electron-log"
import { registeredErc20s } from "../../lib/cfg"
import { coreErc20s, RegisteredERC20 } from "../../lib/erc20/core"

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useErc20List = () => {
	const [changeN, setChangeN] = React.useState(0)
	const erc20s = React.useMemo(() => {
		const core = coreErc20s.map((e) => ({fullName: e, address: ""}))
		const fullList = registeredErc20s()
		const registered = registeredList()
			.map((r) => fullList.find((f) => f.address === r.address))
			.filter((v) => (v !== undefined)) as RegisteredERC20[]
		const custom = customList().map((c) => customToErc20(c))
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

export const addRegisteredErc20 = (fullName: string): RegisteredERC20 => {
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

export const addCustomErc20 = (erc20: {address: string, name: string}): RegisteredERC20 => {
	const fullList = registeredErc20s()
	const registeredErc20 = fullList.find((r) => r.address.toLowerCase() === erc20.address.toLowerCase())
	if (registeredErc20) {
		return addRegisteredErc20(registeredErc20.fullName)
	}
	const list = customList()
	const match = list.find((l) => l.address.toLowerCase() === erc20.address)
	if (match) {
		match.address = erc20.address
		match.name = erc20.name
	} else {
		list.push(erc20)
	}
	setCustomList(list)
	return customToErc20(erc20)
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
const customList = (): {address: string, name: string}[] => {
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
const setCustomList = (list: {address: string, name: string}[]) => {
	localStorage.setItem(customListKey, JSON.stringify(list))
}
const customToErc20 = (erc20: {address:string, name: string}): RegisteredERC20 => {
	return {
		fullName: "Custom:" + erc20,
		address: erc20.address,
	}
}