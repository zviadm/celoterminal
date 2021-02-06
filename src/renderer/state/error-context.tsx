import log from "electron-log"
import { UserError } from "../../lib/error"

import * as React from "react"

interface IErrorContext {
	error?: Error
	setError: (e: Error) => void
	clearError: () => void
}

export const ErrorContext = React.createContext<IErrorContext>({
	setError: () => { /* nothing */ },
	clearError: () => { /* nothing */ },
})

export function ErrorProvider(props: {children: React.ReactNode}): JSX.Element {
	const [error, setError] = React.useState<Error | undefined>()
	const handleError = (error?: Error) => {
		setError(error)
		if (!(error instanceof UserError)) {
			log.error(error)
		}
	}
	React.useEffect(() => {
		const errorListener = (event: ErrorEvent) => {
			event.preventDefault()
			handleError(event.error)
		}
		const unhandledListener = (event: PromiseRejectionEvent) => {
			event.preventDefault()
			handleError(event.reason)
		}
		window.addEventListener('error', errorListener)
		window.addEventListener('unhandledrejection', unhandledListener)
		return () => {
			window.removeEventListener('error', errorListener)
			window.removeEventListener('unhandledrejection', unhandledListener)
		}
	}, [])

	const contextValue = {
		error,
		setError: setError,
		clearError: React.useCallback(() => setError(undefined), []),
	}
	return <ErrorContext.Provider value={contextValue}>{props.children}</ErrorContext.Provider>
}