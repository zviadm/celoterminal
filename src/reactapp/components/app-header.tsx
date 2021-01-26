import * as React from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'
import Sync from '@material-ui/icons/Sync'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'

const AppHeader = (props: {
	title: string,
	isFetching?: boolean,
	refetch?: () => void,
}): JSX.Element => {
	const refetch = props.refetch
	return (
		<Box p={2} style={{
			display: "flex",
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			}}>
			<Typography variant="h6" component="h1">{props.title}</Typography>
			{refetch && (
				props.isFetching ?
				<CircularProgress size={20} /> :
				<IconButton
					aria-label="hide" size="small"
					onClick={() => { refetch() }} >
					<Sync color="secondary" />
				</IconButton>)}
		</Box>
	)
}
export default AppHeader