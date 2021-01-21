import Box from '@material-ui/core/Box'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { AccountsApp, accountsAppName } from './accounts-app'
import AccountsBar from './accounts-bar'
import AppMenu from './app-menu'
import { AppList } from './apps/apps'
import { useAccounts } from './state/accounts-state'
import useLocalStorageState from './state/localstorage-state'

const App = () => {
	const [selectedApp, setSelectedApp] = useLocalStorageState("terminal/core/selected-app", accountsAppName)
	const {accounts, selectedAccount, setSelectedAccount} = useAccounts()

	if (!accounts || !selectedAccount) {
		return (
			<div>Loading...</div>
		)
	}
	const terminalApp = AppList.find((a) => a.name === selectedApp)
	return (
		<div>
			<AccountsBar
				accounts={accounts}
				selectedAccount={selectedAccount}
				setSelectedAccount={setSelectedAccount}
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
				<Box px={2}>
					{
					(selectedApp === accountsAppName) ?
					<AccountsApp /> :
					<terminalApp.renderApp
						accounts={accounts}
						selectedAccount={selectedAccount}
					/>
					}
				</Box>
			</div>
		</div>
	)
}

function render() {
	ReactDOM.render(<App/>, document.getElementById('root'))
}

render();