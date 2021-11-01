import * as React from 'react'
import {
	CircularProgress, IconButton, Typography, Box, Paper
} from '@material-ui/core'
import Sync from '@material-ui/icons/Sync'

import Link from './link'

const AppHeader = (props: {
	app: {title: string, url?: string, iconLarge?: JSX.Element},
	isFetching?: boolean,
	refetch?: () => void,
}): JSX.Element => {
	const refetch = props.refetch
	const title = <Typography variant="h6" component="h1">{props.app.title}</Typography>
	const url = props.app.url
	return (
		<Paper>
		<Box p={2} style={{
			display: "flex",
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			}}>
			<Box display="flex" flexDirection="row" alignItems="center">
				{props.app.iconLarge &&
				<Box display="flex" marginRight={1}>{props.app.iconLarge}</Box>}
				{!url ? title :
				<Link href={url}>{title}</Link>}
			</Box>
			{refetch && (
				props.isFetching ?
				<CircularProgress size={20} /> :
				<IconButton
					id="refetch-data"
					aria-label="hide" size="small"
					onClick={() => { refetch() }} >
					<Sync color="secondary" />
				</IconButton>)}
		</Box>
		</Paper>
	)
}
export default AppHeader