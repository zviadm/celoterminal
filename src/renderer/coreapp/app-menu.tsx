import * as React from 'react'

import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import Box from '@material-ui/core/Box'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import IconButton from '@material-ui/core/IconButton'
import HighlightOffIcon from '@material-ui/icons/HighlightOff'

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
	onRemoveApp: (id: string) => void,
}): JSX.Element => {
	const classes = useStyles()
	const apps: Pick<AppDefinition, "id" | "title" | "icon" | "core">[] = []
	const coreList = props.appList.filter((a) => a.core)
	const pinnedList = props.appList.filter((a) => !a.core)
	apps.push(Accounts)
	apps.push(...coreList)
	apps.push(MoreApps)
	apps.push(...pinnedList)
	return (
		<Box mx={2}>
			<List>
				{
					apps.map((a) => (
						<ListItem
							dense={!a.core}
							button
							key={a.id}
							selected={props.selectedApp === a.id}
							disabled={a.id !== Accounts.id && props.disableApps}
							onClick={() => { props.setSelectedApp(a.id) }}>
							{a.icon &&
							<ListItemIcon className={classes.listIcon}><a.icon /></ListItemIcon>}
							<ListItemText>{a.title}</ListItemText>
							<ListItemSecondaryAction hidden={a.core}>
								<IconButton
									edge="end"
									onClick={() => { props.onRemoveApp(a.id) }}
									>
									<HighlightOffIcon />
								</IconButton>
							</ListItemSecondaryAction>
						</ListItem>
					))
				}
			</List>
		</Box>
	)
}

export default AppMenu
