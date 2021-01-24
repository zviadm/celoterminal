import * as React from 'react'

const useLocalStorageState = <T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
	const storedV = localStorage.getItem(key)
	const [v, setV] = React.useState<T>(storedV && storedV !== "undefined" ? JSON.parse(storedV) as T : initial)
	const storeAndSetV = (newV: T) => {
		localStorage.setItem(key, JSON.stringify(newV))
		setV(newV)
	}
	return [v, storeAndSetV]
}

export default useLocalStorageState