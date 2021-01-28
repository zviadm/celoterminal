import * as React from 'react'

const cachedState = new Map<string, unknown>()

// SessionState is stored in-memory and remains cached until window (i.e. renderer process)
// is closed. This is useful for global state that doesn't need to survive reloading/reopening
// of the app window.
const useSessionState = <T>(key: string, initial: T): [T, (v: T) => void] => {
	const cachedV = cachedState.has(key) ? cachedState.get(key) as T : initial
	const [v, setV] = React.useState<T>(cachedV)
	const cacheAndSetV = (newV: T) => {
		cachedState.set(key, newV)
		setV(newV)
	}
	return [v, cacheAndSetV]
}

export default useSessionState