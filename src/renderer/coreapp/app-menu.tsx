import * as React from 'react'

import {
	makeStyles, DialogContent, Dialog, DialogTitle, DialogActions, Button,
	List, ListItem, ListItemText, ListItemIcon, Box, ListItemSecondaryAction,
	IconButton
} from '@material-ui/core'
import HighlightOffIcon from '@material-ui/icons/HighlightOff'

import { AppDefinition } from '../components/app-definition'
import Accounts from './accounts-app/def'
import MoreApps from './appstore-app/def'
import Alert from '@material-ui/lab/Alert'

const useStyles = makeStyles(() => ({
	listIcon: {
		minWidth: 0,
		marginRight: 10,
	},
}))

type AppDefCommon = Pick<AppDefinition, "id" | "title" | "icon" | "core">

const AppMenu = (props: {
	selectedApp: string,
	setSelectedApp: (selectedApp: string) => void,
	appList: AppDefinition[],
	disableApps: boolean,
	onUninstallApp: (id: string) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [confirmUninstall, setConfirmUninstall] = React.useState<AppDefCommon | undefined>()

	const apps: AppDefCommon[] = []
	const coreList = props.appList.filter((a) => a.core)
	const pinnedList = props.appList.filter((a) => !a.core)
	apps.push(Accounts)
	apps.push(...coreList)
	apps.push(MoreApps)
	apps.push(...pinnedList)
	return (
		<Box mx={2}>
			{confirmUninstall &&
			<ConfirmUninstall
				app={confirmUninstall}
				onCancel={() => setConfirmUninstall(undefined) }
				onUninstall={() => {
					setConfirmUninstall(undefined)
					props.onUninstallApp(confirmUninstall.id)
				}}
			/>}
			<List>
				{
					apps.map((a) => (
						<ListItem
							id={`menu-${a.id}`}
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
									id={`uninstall-app-${a.id}`}
									edge="end"
									onClick={() => { setConfirmUninstall(a) }}
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

const ConfirmUninstall = (props: {
	app: AppDefCommon,
	onUninstall: () => void,
	onCancel: () => void,
}): JSX.Element => {
	return (
		<Dialog open={true} onClose={props.onCancel} maxWidth="sm">
			<DialogTitle>Uninstall Application</DialogTitle>
			<DialogContent>
				<Alert severity="warning">
					Uninstalling an application removes its settings and the local state.
					You can always re-install the application, but its settings and the local state will be reset.
				</Alert>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button
					id="confirm-uninstall"
					color="secondary" onClick={props.onUninstall}>Uninstall</Button>
			</DialogActions>
		</Dialog>
	)
}