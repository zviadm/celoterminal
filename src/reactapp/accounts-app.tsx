import * as React from 'react'
import AppHeader from './app-header'


export const accountsAppName = "Accounts"
export const AccountsApp = (): JSX.Element => {
	return (
		<div style={{display: "flex", flex: 1, flexDirection: "column"}}>
			<AppHeader title={"Accounts"} />
		</div>
	)
}