import log from "electron-log"
import { UserError } from "../../lib/error"

import * as React from "react"

// NOTE(zviadm): Ideally there wouldn't be any errors to ignore at the top level. However,
// if there are special circumstances due to which errors can not actually be caught at the module
// boudary, errsToIgnore escape hatch can be used to not show certain type of errors to the user.
const errsToIgnore: string[] = [
	// WalleConnectV2 library doesn't have a way to catch unhandled errors from its event emitters.
	// And it throws quite a few benign but spammy errors.
	"Bad MAC",
]

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
		const ignore = errsToIgnore.find((msg) => error?.message?.includes(msg))
		if (!ignore) {
			setError(error)
		}
		if (!(error instanceof UserError)) {
			const logF = !ignore ? log.error : log.warn
			logF(error)
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