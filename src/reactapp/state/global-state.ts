import * as React from 'react'

const cachedState = new Map<string, unknown>()

const useGlobalState = <T>(key: string, initial: T): [T, (v: T) => void] => {
	const cachedV = cachedState.has(key) ? cachedState.get(key) as T : initial
	const [v, setV] = React.useState<T>(cachedV)
	const cacheAndSetV = (newV: T) => {
		cachedState.set(key, newV)
		setV(newV)
	}
	return [v, cacheAndSetV]
}

export default useGlobalState