import * as log from 'electron-log'
import { CLIENT_EVENTS } from '@walletconnect/client'
import { SessionTypes } from '@walletconnect/types'

import { Account } from '../../../lib/accounts/accounts'
import { wcGlobal } from './client'

import * as React from 'react'
import {
	Avatar,
	Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Typography
} from '@material-ui/core'
import Link from '../../components/link'

const EstablishSession = (props: {
	uri: string,
	account: Account,
	onCancel: () => void,
	onApprove: () => void,
}): JSX.Element => {
	const uri = props.uri
	const [proposal, setProposal] = React.useState<SessionTypes.Proposal | undefined>()
	const [approving, setApproving] = React.useState(false)
	const onCancel = props.onCancel
	React.useEffect(() => {
		const wc = wcGlobal.wc()
		let cancelled = false
		wc.once(CLIENT_EVENTS.session.proposal, async (proposal: SessionTypes.Proposal) => {
			log.info(`wallet-connect: proposal received (cancelled: ${cancelled})...`, proposal)
			if (cancelled) {
				return wc.reject({proposal})
			}
			setProposal(proposal)
		})
		log.info(`wallet-connect: pairing with ${uri}...`)
		wc.pair({uri})
			.catch((e) => {
				onCancel()
				throw e
			})
		return () => { cancelled = true }
	// NOTE(zviadm): This only needs to run once.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	const handleCancel = () => {
		if (proposal) {
			wcGlobal.wc()
				.reject({proposal})
				.catch((e) => { log.warn(`wallet-connect:`, e) })
		}
		onCancel()
	}
	const handleApprove = () => {
		if (!proposal) {
			return
		}
		setApproving(true)
		wcGlobal
			.approve(proposal, [props.account])
			.then(() => { props.onApprove() })
			.catch((e) => {
				setApproving(false)
				throw e
			})
	}

	const icon = proposal?.proposer.metadata.icons[0]

	return (
		<Dialog open={true}>
			<DialogTitle>Connect DApp</DialogTitle>
			<DialogContent>
				<Box display="flex" flexDirection="column" width={500}>
				{proposal && <>
				<Card>
					<CardHeader
						avatar={icon && <Avatar src={icon} />}
						title={
							<Link href={proposal.proposer.metadata.url}>
								{proposal.proposer.metadata.name}
							</Link>
						}
					/>
					<CardContent>
						<Typography variant="body2" color="textSecondary" component="p">
							{proposal.proposer.metadata.description}
						</Typography>
					</CardContent>
				</Card>
				<Card style={{marginTop: 10}}>
					<CardContent>
						<Typography variant="body1" color="textPrimary">
							{props.account.name}
						</Typography>
						<Typography variant="body1" color="textSecondary" style={{fontFamily: "monospace"}}>
							{props.account.address}
						</Typography>
					</CardContent>
				</Card>
				</>}
				{(!proposal || approving) && <LinearProgress />}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={handleCancel}
					disabled={approving}
					>Cancel</Button>
				<Button
					onClick={handleApprove}
					disabled={!proposal || approving}
					>Approve</Button>
			</DialogActions>
		</Dialog>
	)
}
export default EstablishSession
