import * as React from 'react'
import {
	Avatar, IconButton, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText, Tooltip
} from '@material-ui/core'
import HighlightOffIcon from '@material-ui/icons/HighlightOff'

import Link from '../../components/link'

export interface SessionMetadata {
	description: string;
	url: string;
	icons: string[];
	name: string;
}

const WCSession = (props: {
	metadata: SessionMetadata,
	onDisconnect: () => void,
}): JSX.Element => {
	const icon = props.metadata.icons[0]
	return (
		<ListItem>
			{icon &&
			<ListItemAvatar><Avatar src={icon} /></ListItemAvatar>}
			<ListItemText
				primary={
					<Link href={props.metadata.url}>
						{props.metadata.name}
					</Link>
				}
				secondary={props.metadata.description} />
			<ListItemSecondaryAction>
				<Tooltip title="Disconnect">
					<IconButton
						edge="end" aria-label="disconnect"
						onClick={props.onDisconnect}>
						<HighlightOffIcon />
					</IconButton>
				</Tooltip>
			</ListItemSecondaryAction>
		</ListItem>
	)
}
export default WCSession
