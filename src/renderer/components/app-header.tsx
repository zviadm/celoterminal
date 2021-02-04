import { shell } from 'electron'

import * as React from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'
import Sync from '@material-ui/icons/Sync'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import ButtonBase from '@material-ui/core/ButtonBase'
import Tooltip from '@material-ui/core/Tooltip'

const AppHeader = (props: {
	title: string,
	url?: string,
	isFetching?: boolean,
	refetch?: () => void,
}): JSX.Element => {
	const refetch = props.refetch
	const title = <Typography variant="h6" component="h1">{props.title}</Typography>
	const url = props.url
	return (
		<Paper>
		<Box p={2} style={{
			display: "flex",
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			}}>
			{!url ? title :
			<Tooltip title={url}>
				<ButtonBase
					onClick={() => { shell.openExternal(url) }}>
					{title}
				</ButtonBase>
			</Tooltip>}
			{refetch && (
				props.isFetching ?
				<CircularProgress size={20} /> :
				<IconButton
					aria-label="hide" size="small"
					onClick={() => { refetch() }} >
					<Sync color="secondary" />
				</IconButton>)}
		</Box>
		</Paper>
	)
}
export default AppHeader