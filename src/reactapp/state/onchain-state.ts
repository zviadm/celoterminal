import * as React from 'react'
import { ContractKit } from '@celo/contractkit'
import { CancelPromise } from '../../common/utils'
import kit from '../tx-runner/kit'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const useOnChainState = <T>(
	fetch:
		(kit: ContractKit, c: CancelPromise) => Promise<T>,
	deps: React.DependencyList,
) => {
	const [fetched, setFetched] = React.useState<T | undefined>(undefined)
	const [fetchError, setFetchError] = React.useState<Error | undefined>(undefined)
	const [isFetching, setIsFetching] = React.useState(true)
	const [fetchN, setFetchN] = React.useState(0)
	const [fetchedN, setFetchedN] = React.useState(0)
	React.useEffect(() => {
		console.info(`useOnChainState[${fetchN}]: ...`)
		const c = new CancelPromise()
		if (fetchN === fetchedN) {
			setFetched(undefined)
		}
		setIsFetching(true)

		fetch(kit(), c)
		.then((a: T) => {
			console.info(`useOnChainState[${fetchN}]`, a)
			c.isCancelled() || setFetched(a)
		})
		.catch((e) => {
			console.error(`useOnChainState[${fetchN}]`, e)
			if (!c.isCancelled()) {
				setFetchError(e)
				setFetched(undefined)
			}
		})
		.finally(() => {
			setFetchedN((fetchedN) => fetchN > fetchedN ? fetchN : fetchedN)
			if (!c.isCancelled()) {
				setIsFetching(false)
			}
		})
		return () => { c.cancel() }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetchN, ...deps])

	const refetch = () => {
		setFetchN((fetchN) => (fetchN + 1))
	}
	return {
		isFetching,
		fetched,
		fetchError,
		refetch,
	}
}
export default useOnChainState