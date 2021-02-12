import log from 'electron-log'
import useSessionState from './session-state'

// useLocalStorageState provides a React hook to store data in Window.localStorage. LocalStorage remains
// persisted across app restarts. This is useful for global state that needs to be persisted, but is also ok
// if it gets wiped due to app uninstallation or something like that.
//
// key format should be: 'terminal/<app ID>/...'.
// <T> type must be JSON encodable/decodable.
const useLocalStorageState = <T>(key: string, initial: T): [T, (v: T) => void] => {
	const [cachedV, setCachedV] = useSessionState<{v: T} | undefined>(key, undefined)
	let v
	if (!cachedV) {
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
		setCachedV({v: v})
	} else {
		v = cachedV.v
	}
	const storeV = (newV: T) => {
		setCachedV({v: newV})
		localStorage.setItem(key, JSON.stringify(newV))
	}
	return [v, storeV]
}

export default useLocalStorageState