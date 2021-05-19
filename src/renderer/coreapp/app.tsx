import { remote } from 'electron'
import log from 'electron-log'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { makeStyles, ThemeProvider } from '@material-ui/core/styles'
import theme from './theme'
import CssBaseline from '@material-ui/core/CssBaseline'
import Box from '@material-ui/core/Box'
import Snackbar from '@material-ui/core/Snackbar'
import Alert from '@material-ui/lab/Alert'

import AccountsBar from './accounts-bar'
import AppMenu from './app-menu'
import CheckUpdate from './check-update'
import AccountsApp from './accounts-app/accounts-app'
import TXRunner from './tx-runner/tx-runner'
import { TXCancelled } from './tx-runner/run-txs'

import { AppList } from '../apps/apps'
import Accounts from './accounts-app/def'
import { useAccounts } from './accounts-app/accounts-state'
import useLocalStorageState from '../state/localstorage-state'
import { TXFinishFunc, TXFunc } from '../components/app-definition'
import AppStore from './appstore-app/def'
import AppStoreApp from './appstore-app/appstore-app'
import { ErrorContext, ErrorProvider } from '../state/error-context'
import { useInstalledApps } from './installed-apps-state'
import AlertTitle from '@material-ui/lab/AlertTitle'

const appBarHeightPX = process.platform === "darwin" ? 85 : 60

const App = () => {
	const {error, setError, clearError} = React.useContext(ErrorContext)
	const [_selectedApp, setSelectedApp] = useLocalStorageState("terminal/core/selected-app", Accounts.id)
	const {
		accounts,
		hasPassword,
		addAccount,
		removeAccount,
		renameAccount,
		changePassword,
		selectedAccount,
		setSelectedAccount} = useAccounts()
	const [txFunc, setTXFunc] = React.useState<
		{f: TXFunc, onFinish?: TXFinishFunc} | undefined>()
	const runTXs = React.useCallback((
		f: TXFunc,
		onFinish?: TXFinishFunc) => {
		setTXFunc({f, onFinish})
	}, [])
	const {
		installedApps,
		installApp,
		uninstallApp
	} = useInstalledApps()
	const handleInstallApp = React.useCallback((id: string) => {
		installApp(id)
		setSelectedApp(id)
	}, [installApp, setSelectedApp])
	const handleUninstallApp = React.useCallback((id: string) => {
		uninstallApp(id)
		if (_selectedApp === id) {
			setSelectedApp(Accounts.id)
		}
	}, [uninstallApp, setSelectedApp, _selectedApp])
	const appList = React.useMemo(
		() => (AppList.filter((a) => a.core).concat(...installedApps)),
		[installedApps])
	const [notificationsByApp, setNotificationsByApp] = React.useState<Map<string, number>>(new Map<string, number>())
	React.useEffect(() => {
		let lastLogMs = 0
		const t = setInterval(
			() => {
				const byApp = new Map<string, number>()
				let totalCount = 0
				for (const app of appList) {
					const notifications = app.notifyCount && app.notifyCount()
					if (notifications !== undefined) {
						byApp.set(app.id, notifications)
						totalCount += notifications
					}
				}
				if (totalCount !== remote.app.getBadgeCount()) {
					remote.app.setBadgeCount(totalCount)
				}
				if (Date.now() - lastLogMs > 30 * 1000) {
					lastLogMs = Date.now()
					log.info(`coreapp: pending notifications: ${totalCount}`, Array.from(byApp.entries()))
				}
				setNotificationsByApp((n) => {
					let changed = n.size !== byApp.size
					if (!changed) {
						n.forEach((v, k) => {
							changed ||= (byApp.get(k) !== v)
						})
					}
					return changed ? byApp : n
				})
			}, 1000)
		return () => { clearInterval(t) }
	}, [appList])

	let selectedApp = _selectedApp
	let renderedApp
	if (!selectedAccount || selectedApp === Accounts.id) {
		selectedApp = Accounts.id
		renderedApp = <AccountsApp
			accounts={accounts}
			selectedAccount={selectedAccount}
			runTXs={runTXs}

			hasPassword={hasPassword}
			onAdd={addAccount}
			onRemove={removeAccount}
			onRename={renameAccount}
			onChangePassword={changePassword}
		/>
	} else if (selectedApp === AppStore.id) {
		renderedApp = <AppStoreApp
			installedApps={installedApps}
			onInstallApp={handleInstallApp}
		/>
	} else {
		let terminalApp = appList.find((a) => a.id === selectedApp)
		if (!terminalApp) {
			terminalApp = appList[0]
			selectedApp = terminalApp.id
		}
		renderedApp = <terminalApp.renderApp
			accounts={accounts}
			selectedAccount={selectedAccount}
			runTXs={runTXs}
		/>
	}

	const txOnFinish: TXFinishFunc = React.useCallback((e, ...args) => {
		if (e && !(e instanceof TXCancelled)) {
			setError(e)
			log.error(`TX:`, e)
		}
		setTXFunc(undefined)
		if (txFunc?.onFinish) {
			txFunc.onFinish(e, ...args)
		}
	}, [txFunc, setError])

	return (
		<Box display="flex" flexDirection="column" height="100%" >
			{process.platform === "darwin" ? <AppDragRegion /> : null}
			<ErrorSnack error={error} onClose={clearError} />
			{selectedAccount && txFunc &&
			<TXRunner
				selectedAccount={selectedAccount}
				accounts={accounts}
				txFunc={txFunc.f}
				onFinish={txOnFinish}
			/>}
			<Box display="flex" flexDirection="column" justifyContent="flex-end" height={`${appBarHeightPX}px`}>
				<AccountsBar
					accounts={accounts}
					selectedAccount={selectedAccount}
					onSelectAccount={setSelectedAccount}
				/>
			</Box>
			<Box
				display="flex" flexDirection="row"
				position="absolute" top={appBarHeightPX} left={0} right={0} bottom={0}
				overflow="hidden">
				<Box
					display="flex" flexDirection="column"
					overflow="auto"
					>
					<AppMenu
						selectedApp={selectedApp}
						setSelectedApp={setSelectedApp}
						appList={appList}
						notificationsByApp={notificationsByApp}
						disableApps={!selectedAccount}
						onUninstallApp={handleUninstallApp}
					/>
					<Box m={2} alignSelf="flex-end">
						<CheckUpdate />
					</Box>
				</Box>
				<Box
					display="flex" flexDirection="column"
					overflow="auto"
					flex={1}
					paddingLeft={2}
					paddingRight={2}>
					<ErrorBoundary selectedApp={selectedApp}>
						<Box
							display="flex" flexDirection="column"
							flex={1} paddingBottom={2}>{renderedApp}</Box>
					</ErrorBoundary>
				</Box>
			</Box>
		</Box>
	)
}

const ErrorSnack = (props: {
	error?: Error
	onClose: () => void,
}) => (
	<Snackbar
		open={props.error ? true : false}
		autoHideDuration={10000}
		onClose={props.onClose}
		anchorOrigin={{ vertical: "top", horizontal: "center" }}>
		<Alert
			id="error-snack"
			style={{maxWidth: 700, overflowWrap: "break-word"}}
			severity="error"
			onClose={props.onClose}>{props.error?.message}</Alert>
	</Snackbar>
)

class ErrorBoundary extends React.Component<{selectedApp: string}, {error?: Error}> {
	constructor(props: {selectedApp: string}) {
		super(props)
		this.state = {}
	}

	static getDerivedStateFromError(error: Error) {
		return { error: error }
	}

	componentDidUpdate(prevProps: {selectedApp: string}) {
		if (this.props.selectedApp !== prevProps.selectedApp) {
			this.setState({error: undefined})
		}
	}

	render() {
		if (this.state.error) {
			return <Box id="error-boundary-fallback">
				<Alert severity="error">
					<AlertTitle>UNEXPECTED CRASH</AlertTitle>
					{this.state.error?.message}
				</Alert>
			</Box>
		}
		return this.props.children
	}
}

const ThemedApp = () => (
	<ThemeProvider theme={theme}>
		<ErrorProvider>
			<CssBaseline />
			<App />
		</ErrorProvider>
	</ThemeProvider>
)

const appDragRegionStyles = makeStyles(() => ({
	titleBar: {
		"-webkit-app-region": "drag",
		"height": `${appBarHeightPX}px`,
		"position": "absolute",
		"top": 0,
		"left": 0,
		"right": 0,
	},
}))

const AppDragRegion = () => {
	const classes = appDragRegionStyles()
	return <Box className={classes.titleBar} />
}

ReactDOM.render(<ThemedApp />, document.getElementById('app'))