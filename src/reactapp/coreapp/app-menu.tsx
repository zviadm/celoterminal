import * as React from 'react'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'

import { AppDefinition } from '../components/app-definition'
import { accountsAppName } from './accounts-app/accounts-app'

const AppMenu = (props: {
	selectedApp: string,
	setSelectedApp: (selectedApp: string) => void,
	appList: AppDefinition[],
}): JSX.Element => {
	const apps: {
		name: string
	}[] = [{name: accountsAppName}].concat((props.appList as {name: string}[]))
	return (
		<div>
			<List>
				{
					apps.map((a) => (
						<ListItem
							button
							key={a.name}
							selected={props.selectedApp === a.name}
							onClick={() => { props.setSelectedApp(a.name) }}>
							<ListItemText>{a.name}</ListItemText>
						</ListItem>
					))
				}
			</List>
		</div>
	)
}

export default AppMenu
