import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { CeloTxReceipt } from '@celo/connect'

import Box from '@material-ui/core/Box'
import Snackbar from '@material-ui/core/Snackbar'
import Alert from '@material-ui/lab/Alert'

import AccountsBar from './accounts-bar'
import AppMenu from './app-menu'
import { AccountsApp, accountsAppName } from './accounts-app'
import { AppList } from '../apps/apps'
import { useAccounts } from '../state/accounts-state'
import useLocalStorageState from '../state/localstorage-state'
import TXRunner, { TXFinishFunc, TXFunc } from '../tx-runner/tx-runner'
import { accountsDB } from '../accountsdb/accountsdb'
import { Account } from '../accountsdb/accounts'

const App = () => {
	const [_selectedApp, setSelectedApp] = useLocalStorageState("terminal/core/selected-app", accountsAppName)
	const {
		accounts,
		addAccount,
		selectedAccount,
		setSelectedAccount} = useAccounts()
	const [txFunc, setTXFunc] = React.useState<
		{f: TXFunc, onFinish?: TXFinishFunc} | undefined>()
	const runTXs = (
		f: TXFunc,
		onFinish?: TXFinishFunc) => {
		setTXFunc({f, onFinish})
	}
	const [error, setError] = React.useState<Error | undefined>()
	const _addAccount = (a: Account) => {
		try {
			addAccount(a)
		} catch (e) {
			setError(e)
		}
	}

	if (!accounts) {
		// TODO(zviad): Different loading screen. Waiting to load accounts from the database
		// for the first time. Can't start without this.
		return (
			<div>Loading...</div>
		)
	}
	let renderedApp
	let selectedApp = _selectedApp
	if (!selectedAccount) {
		selectedApp = accountsAppName
		renderedApp = <AccountsApp
			accounts={accounts}
			onAdd={_addAccount}
		/>
	} else {
		const terminalApp = AppList.find((a) => a.name === selectedApp)
		try {
			renderedApp = (selectedApp === accountsAppName || !terminalApp) ?
				<AccountsApp
					accounts={accounts}
					onAdd={_addAccount}
				/> :
				<terminalApp.renderApp
					accounts={accounts}
					selectedAccount={selectedAccount}
					runTXs={runTXs}
					onError={setError}
				/>
		} catch (e) {
			setError(e)
			renderedApp = <div></div>
		}
	}

	return (
		<div>
			{selectedAccount &&
			<TXRunner
				selectedAccount={selectedAccount}
				txFunc={txFunc?.f}
				onFinish={(e: Error | null, r: CeloTxReceipt[]) => {
					if (e) {
						setError(e)
					}
					if (txFunc?.onFinish) {
						txFunc.onFinish(e, r)
					}
					setTXFunc(undefined)
				}}
			/>}
			<AccountsBar
				accounts={accounts}
				selectedAccount={selectedAccount}
				onSelectAccount={setSelectedAccount}
			/>
			<div style={{
				display: "flex",
				flexDirection: "row",
			}}>
				<AppMenu
					selectedApp={selectedApp}
					setSelectedApp={setSelectedApp}
					appList={AppList}
				/>
				<Box paddingLeft={2} style={{display: "flex", flex: 1}}>{renderedApp}</Box>
			</div>
			<Snackbar
        open={error ? true : false}
        autoHideDuration={10000}
        onClose={() => { setError(undefined) }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert
          style={{maxWidth: 1000}}
          severity="error"
          onClose={() => { setError(undefined) }}>{error?.message}</Alert>
      </Snackbar>
		</div>
	)
}

ReactDOM.render(<App/>, document.getElementById('root'))
window.addEventListener('unload', () => {
	accountsDB().close()
	return
})