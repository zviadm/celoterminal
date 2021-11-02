import * as React from 'react'
import {
	Avatar, Box, IconButton, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText, Tooltip, Typography
} from '@material-ui/core'
import HighlightOffIcon from '@material-ui/icons/HighlightOff'

import Link from '../../components/link'
import { SessionMetadata } from './session'
import LinkedAddress from '../../components/linked-address'

import { Account } from '../../../lib/accounts/accounts'
import { fmtAddress } from '../../../lib/utils'

const WCSession = (props: {
	accounts: Account[],
	metadata: SessionMetadata,
	onDisconnect: () => void,
}): JSX.Element => {
	const icon = props.metadata.icon
	// TODO(zviadm): for now assume only single account support
	const accountAddr = props.metadata.accounts[0]
	const account = props.accounts.find((a) => a.address === accountAddr)
	return (
		<ListItem>
			{icon &&
			<ListItemAvatar><Avatar src={icon} /></ListItemAvatar>}
			<ListItemText
				disableTypography
				primary={<Link href={props.metadata.url}>{props.metadata.name}</Link>}
				secondary={
					<Box display="flex" flexDirection="column">
						<Typography variant="caption" component="p">{props.metadata.description}</Typography>
						<Box display="flex" alignSelf="flex-end">
							<LinkedAddress
								address={accountAddr}
								name={account && `${account.name}: ${fmtAddress(accountAddr)}`}
							/>
						</Box>
					</Box>
				} />
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
