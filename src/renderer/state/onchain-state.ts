import * as React from 'react'
import log from 'electron-log'
import { ContractKit } from '@celo/contractkit'

import { CancelPromise } from '../../lib/utils'
import kitInstance from './kit'
import { ErrorContext } from './error-context'

// useOnChainState provides a React hook to help with on-chain data fetching.
// fetchCallback must be wrapped in React.useCallback to be memoized based on its
// dependencies.
const useOnChainState = <T>(
	fetchCallback:
		(kit: ContractKit, c: CancelPromise) => Promise<T>,
	opts?: {noErrorPropagation?: boolean},
): {
	isFetching: boolean,
	fetched?: T,
	fetchError?: Error,
	refetch: () => void,
} => {
	const {setError} = React.useContext(ErrorContext)
	const [fetched, setFetched] = React.useState<T | undefined>(undefined)
	const [fetchError, setFetchError] = React.useState<Error | undefined>(undefined)
	const [isFetching, setIsFetching] = React.useState(true)
	const [fetchN, setFetchN] = React.useState(0)
	React.useEffect(() => {
		// Reset fetched data and error when `fetchCallback` changes.
		setFetched(undefined)
		setFetchError(undefined)
	}, [fetchCallback])
	const noErrorPropagation = opts?.noErrorPropagation
	React.useEffect(() => {
		log.info(`useOnChainState[${fetchN}]: fetching...`)
		const c = new CancelPromise()
		setIsFetching(true)

		fetchCallback(kitInstance(), c)
		.then((a: T) => {
			if (!c.isCancelled()) {
				log.info(`useOnChainState[${fetchN}]: fetched`)
				log.debug(`useOnChainState[${fetchN}]:`, a)
				setFetched(a)
			}
		})
		.catch((e) => {
			if (!c.isCancelled()) {
				setFetchError(e)
				setFetched(undefined)
				if (!noErrorPropagation) {
					setError(e)
				}
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
				log.info(`useOnChainState[${fetchN}]: cancelled`)
				c.cancel()
			}
		}
	}, [fetchN, fetchCallback, noErrorPropagation, setError])

	const refetch = React.useCallback(() => {
		setFetchN((fetchN) => (fetchN + 1))
	}, [setFetchN])
	return {
		isFetching,
		fetched,
		fetchError,
		refetch,
	}
}
export default useOnChainState