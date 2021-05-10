import { SessionTypes } from '@walletconnect/types'
import { ERROR, getError } from '@walletconnect/utils'

import { wcGlobal } from './client'

import * as React from 'react'
import {
	Avatar, IconButton, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText, Tooltip
} from '@material-ui/core'
import HighlightOffIcon from '@material-ui/icons/HighlightOff'

import Link from '../../components/link'

const WCSession = (props: {
	session: SessionTypes.Settled,
}): JSX.Element => {
	const icon = props.session.peer.metadata.icons[0]
	const handleDisconnect = () => {
		const wc = wcGlobal.wc()
		if (!wc) {
			return
		}
		wc.disconnect({
			topic: props.session.topic,
			reason: getError(ERROR.USER_DISCONNECTED),
		})
	}
	return (
		<ListItem>
			{icon &&
			<ListItemAvatar><Avatar src={icon} /></ListItemAvatar>}
			<ListItemText
				primary={
					<Link href={props.session.peer.metadata.url}>
						{props.session.peer.metadata.name}
					</Link>
				}
				secondary={props.session.peer.metadata.description} />
			<ListItemSecondaryAction>
				<Tooltip title="Disconnect">
					<IconButton
						edge="end" aria-label="disconnect"
						onClick={handleDisconnect}>
						<HighlightOffIcon />
					</IconButton>
				</Tooltip>
			</ListItemSecondaryAction>
		</ListItem>
	)
}
export default WCSession
