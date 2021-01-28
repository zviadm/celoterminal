import * as React from 'react'
import { ContractKit } from '@celo/contractkit'
import { CancelPromise } from '../../common/utils'
import kit from '../coreapp/tx-runner/kit'

// TODO(zviad): Document OnChainState behaviour.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const useOnChainState = <T>(
	fetch:
		(kit: ContractKit, c: CancelPromise) => Promise<T>,
	deps: React.DependencyList,
	onError?: (e: Error) => void,
) => {
	const [fetched, setFetched] = React.useState<T | undefined>(undefined)
	const [fetchError, setFetchError] = React.useState<Error | undefined>(undefined)
	const [isFetching, setIsFetching] = React.useState(true)
	const [fetchN, setFetchN] = React.useState(0)
	const [fetchedN, setFetchedN] = React.useState(0)
	React.useEffect(() => {
		console.info(`useOnChainState[${fetchN}]: fetching...`)
		const c = new CancelPromise()
		if (fetchN === fetchedN) {
			setFetched(undefined)
		} else {
			setFetchedN(fetchN)
		}
		setIsFetching(true)

		fetch(kit(), c)
		.then((a: T) => {
			if (!c.isCancelled()) {
				console.info(`useOnChainState[${fetchN}]`, a)
				setFetched(a)
			}
		})
		.catch((e) => {
			if (!c.isCancelled()) {
				console.error(`useOnChainState[${fetchN}]`, e)
				setFetchError(e)
				onError && onError(e)
				setFetched(undefined)
			}
		})
		.finally(() => {
			if (!c.isCancelled()) {
				setIsFetching(false)
				c.cancel()
			}
		})
		return () => {
			if (!c.isCancelled()) {
				console.info(`useOnChainState[${fetchN}]: cancelled`)
				c.cancel()
			}
		}
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