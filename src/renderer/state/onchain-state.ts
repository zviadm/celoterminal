import * as React from 'react'
import log from 'electron-log'
import { ContractKit } from '@celo/contractkit'

import { CancelPromise } from '../../lib/utils'
import kit from './kit'

// useOnChainState provides react hook to help with on-chain data fetching.
// fetchCallback must be wrapped in React.useCallback to be memoized based on its
// dependencies.
const useOnChainState = <T>(
	fetchCallback:
		(kit: ContractKit, c: CancelPromise) => Promise<T>,
	onError?: (e: Error) => void,
): {
	isFetching: boolean,
	fetched?: T,
	fetchError?: Error,
	refetch: () => void,
} => {
	const [fetched, setFetched] = React.useState<T | undefined>(undefined)
	const [fetchError, setFetchError] = React.useState<Error | undefined>(undefined)
	const [isFetching, setIsFetching] = React.useState(true)
	const [fetchN, setFetchN] = React.useState(0)
	React.useEffect(() => {
		// Reset fetched data and error when `fetchCallback` changes.
		setFetched(undefined)
		setFetchError(undefined)
	}, [fetchCallback])
	React.useEffect(() => {
		log.info(`useOnChainState[${fetchN}]: fetching...`)
		const c = new CancelPromise()
		setIsFetching(true)

		fetchCallback(kit(), c)
		.then((a: T) => {
			if (!c.isCancelled()) {
				log.info(`useOnChainState[${fetchN}]`, a)
				setFetched(a)
			}
		})
		.catch((e) => {
			if (!c.isCancelled()) {
				log.error(`useOnChainState[${fetchN}]`, e)
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
				log.info(`useOnChainState[${fetchN}]: cancelled`)
				c.cancel()
			}
		}
	}, [fetchN, fetchCallback, onError])

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