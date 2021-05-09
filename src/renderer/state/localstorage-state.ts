import log from 'electron-log'
import * as React from 'react'

// useLocalStorageState provides a React hook to store data in Window.localStorage. LocalStorage remains
// persisted across app restarts. This is useful for global state that needs to be persisted, but is also ok
// if it gets wiped due to app uninstallation or something like that.
//
// key format should be: 'terminal/<app ID>/...'.
// <T> type must be JSON encodable/decodable.
const useLocalStorageState = <T>(key: string, initial: T): [T, (v: T) => void] => {
	const [_v, setV] = React.useState<{v: T} | undefined>(undefined)
	let v
	if (!_v) {
		const storedV = localStorage.getItem(key)
		let parsedV: T | undefined = undefined
		try {
			if (storedV && storedV !== "undefined") {
				parsedV = JSON.parse(storedV)
			}
		} catch (e) {
			log.error(`LocalStorage: unable to parse: ${key} - ${storedV}`)
		}
		v = parsedV !== undefined ? parsedV : initial
		setV({v: v})
	} else {
		v = _v.v
	}
	const storeV = React.useCallback((newV: T) => {
		localStorage.setItem(key, JSON.stringify(newV))
		setV({v: newV})
	}, [key])
	return [v, storeV]
}

export default useLocalStorageState