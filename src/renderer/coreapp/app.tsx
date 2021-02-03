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

import { AppList } from '../apps/apps'
import Accounts from './accounts-app/def'
import { useAccounts } from './accounts-app/accounts-state'
import useLocalStorageState from '../state/localstorage-state'
import { TXFinishFunc, TXFunc } from '../components/app-definition'
import AppStore from './appstore-app/def'
import AppStoreApp from './appstore-app/appstore-app'

const App = () => {
	const [_selectedApp, setSelectedApp] = useLocalStorageState("terminal/core/selected-app", Accounts.id)
	const {
		accounts,
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
	const [pinnedApps, setPinnedApps] = useLocalStorageState<{id: string}[]>("terminal/core/pinned-apps", [])
	const [error, setError] = React.useState<Error | undefined>()

	let renderedApp
	let selectedApp = _selectedApp
	if (!selectedAccount) {
		selectedApp = Accounts.id
		renderedApp = <AccountsApp
			accounts={accounts}
			onAdd={addAccount}
			onRemove={removeAccount}
			onRename={renameAccount}
			onChangePassword={changePassword}
			onError={setError}
		/>
	} else {
		const terminalApp = AppList.find((a) => a.id === selectedApp)
		try {
			switch (selectedApp) {
			case Accounts.id:
				renderedApp = <AccountsApp
					accounts={accounts}
					onAdd={addAccount}
					onRemove={removeAccount}
					onRename={renameAccount}
					onChangePassword={changePassword}
					onError={setError}
				/>
				break
			case AppStore.id:
				renderedApp = <AppStoreApp
					onError={setError}
				/>
				break
			default:
				if (!terminalApp) {
					throw new Error(`Unknown app: '${selectedApp}'`)
				}
				renderedApp = <terminalApp.renderApp
					accounts={accounts}
					selectedAccount={selectedAccount}
					runTXs={runTXs}
					onError={setError}
				/>
				break
			}
		} catch (e) {
			renderedApp = <Box><Alert severity="error">{e?.message}</Alert></Box>
			log.error(`renderApp:`, e)
		}
	}
	const txOnFinish: TXFinishFunc = (e, r) => {
		if (e && e.message !== "Cancelled") {
			setError(e)
			log.error(`TX:`, e)
		}
		if (txFunc?.onFinish) {
			txFunc.onFinish(e, r)
		}
		setTXFunc(undefined)
	}
	const clearError = () => { setError(undefined) }

	return (
		<Box>
			<ErrorSnack error={error} onClose={clearError} />
			{selectedAccount &&
			<TXRunner
				selectedAccount={selectedAccount}
				txFunc={txFunc?.f}
				onFinish={txOnFinish}
				onError={setError}
			/>}
			<AccountsBar
				accounts={accounts}
				selectedAccount={selectedAccount}
				onSelectAccount={setSelectedAccount}
				onError={setError}
			/>
			<Box display="flex" flexDirection="row" >
				<Box display="flex" flexDirection="column" >
					<AppMenu
						selectedApp={selectedApp}
						setSelectedApp={setSelectedApp}
						appList={AppList}
						disableApps={!selectedAccount}
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
			style={{maxWidth: 700, overflowWrap: "break-word"}}
			severity="error"
			onClose={props.onClose}>{props.error?.message}</Alert>
	</Snackbar>
)

const ThemedApp = () => (
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<App />
	</ThemeProvider>
)

ReactDOM.render(<ThemedApp />, document.getElementById('app'))