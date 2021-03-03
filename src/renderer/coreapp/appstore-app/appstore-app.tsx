import MoreApps from './def'
import { AppList } from '../../apps/apps'
import { AppDefinition } from '../../components/app-definition'

import * as React from 'react'
import {
	Box, Fab, Paper, Typography
} from '@material-ui/core'
import { Add } from '@material-ui/icons'

import AppHeader from '../../components/app-header'
import Link from '../../components/link'
import AppContainer from '../../components/app-container'

export interface PinnedApp {
	id: string
}

const optionalApps = AppList.filter((a) => !a.core)

const AppStoreApp = (props: {
	pinnedApps: PinnedApp[],
	onAddApp: (id: string) => void,
}): JSX.Element => {
	const pinnedIds = new Set(props.pinnedApps.map((p) => p.id))
	const optionalAppList = optionalApps.filter((a) => !pinnedIds.has(a.id))
	return (
		<AppContainer>
			<AppHeader app={MoreApps} />
			<Box
				display="flex"
				flexDirection="row"
				marginTop={2}
				flexWrap="wrap">
				{optionalAppList.map((a) => (
					<AppCard
						key={a.id}
						app={a}
						onAdd={() => { props.onAddApp(a.id) }}
						/>
				))}
			</Box>
		</AppContainer>
	)
}
export default AppStoreApp

const AppCard = (props: {
	app: AppDefinition,
	onAdd: () => void,
}) => {
	const url = props.app.url
	const description = props.app.description
	return (
		<Box width={270} marginBottom={2} marginRight={2}>
			<Paper>
				<Box p={2} display="flex" flexDirection="column">
					<Box
						display="flex"
						flexDirection="row"
						justifyContent="space-between"
						alignItems="center">
						<Typography variant="h6">{props.app.title}</Typography>
						<props.app.icon fontSize="large" />
					</Box>
					<Box height={100} overflow="auto" my={0.5}>
						<Typography variant="body2" color="textSecondary">{description || ''}</Typography>
					</Box>
					<Box
						display="flex"
						flexDirection="row"
						justifyContent="flex-end">
						{url &&
						<Box
							display="flex"
							flexDirection="row"
							flex={1}
							alignItems="flex-end">
							<Link href={url}>Learn More</Link>
						</Box>}
						<Fab
							id={`install-app-${props.app.id}`}
							color="primary"
							size="small"
							onClick={props.onAdd}>
							<Add />
						</Fab>
					</Box>
				</Box>
			</Paper>
		</Box>
	)
}
