import * as React from 'react'
import { ContractKit, newKit } from '@celo/contractkit'
import { CancelPromise } from '../utils'

let _kit: ContractKit | undefined
const kit = () => {
	if (!_kit) {
		_kit = newKit(`https://forno.celo.org`)
	}
	return _kit
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const useOnChainState = <T>(
	fetch:
		(kit: ContractKit, c: CancelPromise) => Promise<T>,
	deps?: React.DependencyList,
) => {
	const [fetched, setFetched] = React.useState<T | undefined>(undefined)
	const [fetchError, setFetchError] = React.useState<Error | undefined>(undefined)
	const [isFetching, setIsFetching] = React.useState(true)
	const [fetchN, setFetchN] = React.useState(0)
	React.useEffect(() => {
		const c = new CancelPromise()
		setIsFetching(true)

		fetch(kit(), c)
		.then((a: T) => {
			if (!c.isCancelled()) {
				setFetched(a)
			}
		})
		.catch((e) => {
			if (!c.isCancelled()) {
				setFetchError(e)
			}
		})
		.finally(() => {
			if (!c.isCancelled()) {
				console.info(`fetch finished: ${fetchN}`)
				setIsFetching(false)
			} else {
				console.info(`fetch canceled: ${fetchN}`)
			}
		})

		return () => {
			c.cancel()
		}
	}, [fetchN].concat(deps))

	const refetch = () => {
		setFetchN(fetchN + 1)
	}
	return {
		isFetching,
		fetched,
		fetchError,
		refetch,
	}
}
export default useOnChainState