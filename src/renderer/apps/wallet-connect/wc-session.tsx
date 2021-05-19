import { SessionTypes } from '@walletconnect/types'
import { ERROR } from '@walletconnect/utils'

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
	const peer = props.session.peer
	const icon = peer.metadata.icons[0]
	const handleDisconnect = () => {
		const wc = wcGlobal.wc()
		if (!wc) {
			return
		}
		wc.disconnect({
			topic: props.session.topic,
			reason: ERROR.USER_DISCONNECTED.format(),
		})
	}
	return (
		<ListItem>
			{icon &&
			<ListItemAvatar><Avatar src={icon} /></ListItemAvatar>}
			<ListItemText
				primary={
					<Link href={peer.metadata.url}>
						{peer.metadata.name}
					</Link>
				}
				secondary={peer.metadata.description} />
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
