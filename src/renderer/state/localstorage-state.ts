import * as React from 'react'

// LocalStorageState is stored in Window.localStorage. LocalStorage remains persisted as long as app
// is alive. This is useful for global state that needs to survive reload/reopening of the app
// window, but does not need to survive through app restarts.
// State stored in LocalStorage must be JSON encodable.
const useLocalStorageState = <T>(key: string, initial: T): [T, (v: T) => void] => {
	const storedV = localStorage.getItem(key)
	let parsedV: T | undefined = undefined
	try {
		if (storedV && storedV !== "undefined") {
			parsedV = JSON.parse(storedV)
		}
	} catch (e) {
		console.error(`LocalStorage: unable to parse: ${key} - ${storedV}`)
	}
	const [v, setV] = React.useState<T>(parsedV !== undefined ? parsedV : initial)
	const storeAndSetV = (newV: T) => {
		localStorage.setItem(key, JSON.stringify(newV))
		setV(newV)
	}
	return [v, storeAndSetV]
}

export default useLocalStorageState