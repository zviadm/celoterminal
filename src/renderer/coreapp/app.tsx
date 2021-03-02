import log from 'electron-log'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { ThemeProvider } from '@material-ui/core/styles'
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
import { AppDefinition, TXFinishFunc, TXFunc } from '../components/app-definition'
import AppStore from './appstore-app/def'
import AppStoreApp, { PinnedApp } from './appstore-app/appstore-app'
import { ErrorContext, ErrorProvider } from '../state/error-context'

const appsById = new Map(AppList.map((a) => [a.id, a]))

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
	const runTXs = (
		f: TXFunc,
		onFinish?: TXFinishFunc) => {
		setTXFunc({f, onFinish})
	}
	const [pinnedApps, setPinnedApps] = useLocalStorageState<PinnedApp[]>("terminal/core/pinned-apps", [])

	const appListAll = AppList
	const pinnedAppList = pinnedApps.map((p) => appsById.get(p.id)).filter((p) => p) as AppDefinition[]
	const appList = AppList.filter((a) => a.core).concat(...pinnedAppList)
	const handleAddApp = (id: string) => {
		if (pinnedApps.find((p) => p.id === id)) {
			return
		}
		const pinnedAppsCopy = pinnedApps.concat({id: id})
		setPinnedApps(pinnedAppsCopy)
		setSelectedApp(id)
	}
	const handleRemoveApp = (id: string) => {
		const pinnedAppsCopy = pinnedApps.filter((p) => p.id !== id)
		if (selectedApp === id) {
			setSelectedApp(Accounts.id)
		}
		setPinnedApps(pinnedAppsCopy)
	}

	let selectedApp = _selectedApp
	let renderedApp
	try {
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
				pinnedApps={pinnedApps}
				onAddApp={handleAddApp}
			/>
		} else {
			const terminalApp = appListAll.find((a) => a.id === selectedApp)
			if (!terminalApp) {
				throw new Error(`Unknown app: '${selectedApp}'`)
			}
			renderedApp = <terminalApp.renderApp
				accounts={accounts}
				selectedAccount={selectedAccount}
				runTXs={runTXs}
			/>
		}
	} catch (e) {
		renderedApp = <Box><Alert severity="error">{e?.message}</Alert></Box>
		log.error(`renderApp:`, e)
	}

	const txOnFinish: TXFinishFunc = (e, r) => {
		if (e && !(e instanceof TXCancelled)) {
			setError(e)
			log.error(`TX:`, e)
		}
		setTXFunc(undefined)
		if (txFunc?.onFinish) {
			txFunc.onFinish(e, r)
		}
	}

	return (
		<Box>
			<ErrorSnack error={error} onClose={clearError} />
			{selectedAccount &&
			<TXRunner
				selectedAccount={selectedAccount}
				accounts={accounts}
				txFunc={txFunc?.f}
				onFinish={txOnFinish}
			/>}
			<AccountsBar
				accounts={accounts}
				selectedAccount={selectedAccount}
				onSelectAccount={setSelectedAccount}
			/>
			<Box display="flex" flexDirection="row" >
				<Box display="flex" flexDirection="column" >
					<AppMenu
						selectedApp={selectedApp}
						setSelectedApp={setSelectedApp}
						appList={appList}
						disableApps={!selectedAccount}
						onRemoveApp={handleRemoveApp}
					/>
					<Box m={2} alignSelf="flex-end">
						<CheckUpdate />
					</Box>
				</Box>
				<Box
					display="flex"
					flex={1}
					paddingLeft={2}
					paddingRight={2}
					marginBottom={2}>
					{renderedApp}
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

const ThemedApp = () => (
	<ThemeProvider theme={theme}>
		<ErrorProvider>
			<CssBaseline />
			<App />
		</ErrorProvider>
	</ThemeProvider>
)

ReactDOM.render(<ThemedApp />, document.getElementById('app'))