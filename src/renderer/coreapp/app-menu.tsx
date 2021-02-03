import * as React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import Box from '@material-ui/core/Box'

import { AppDefinition } from '../components/app-definition'
import Accounts from './accounts-app/def'
import MoreApps from './appstore-app/def'

const useStyles = makeStyles(() => ({
	listIcon: {
		minWidth: 0,
		marginRight: 10,
	},
}))

const AppMenu = (props: {
	selectedApp: string,
	setSelectedApp: (selectedApp: string) => void,
	appList: AppDefinition[],
	disableApps: boolean,
}): JSX.Element => {
	const classes = useStyles()
	const apps: Pick<AppDefinition, "id" | "title" | "icon">[] = []
	apps.push(Accounts)
	apps.push(...props.appList)
	apps.push(MoreApps)
	return (
		<Box mx={2}>
			<List>
				{
					apps.map((a) => (
						<ListItem
							button
							key={a.id}
							selected={props.selectedApp === a.id}
							disabled={a.id !== Accounts.id && props.disableApps}
							onClick={() => { props.setSelectedApp(a.id) }}>
							{a.icon &&
							<ListItemIcon className={classes.listIcon}><a.icon /></ListItemIcon>}
							<ListItemText>{a.title}</ListItemText>
						</ListItem>
					))
				}
			</List>
		</Box>
	)
}

export default AppMenu
