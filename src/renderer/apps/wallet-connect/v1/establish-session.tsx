import * as log from 'electron-log'
import WalletConnect from 'wcv1/client'

import { Account } from '../../../../lib/accounts/accounts'
import { CFG } from '../../../../lib/cfg'
import { newSessionStorageId } from './storage'

import * as React from 'react'
import {
	Avatar,
	Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Typography
} from '@material-ui/core'
import Link from '../../../components/link'
import { celoTerminalMetadata, WCV1 } from './client'
import { ISession } from '../session'

const EstablishSession = (props: {
	uri: string,
	account: Account,
	onCancel: () => void,
	onApprove: (wc: ISession) => void,
}): JSX.Element => {
	const uri = props.uri
	const [proposal, setProposal] = React.useState<{
		peerId: string,
		peerMeta: {
			name: string,
			description: string,
			icons: string[],
			url: string,
		}
	} | undefined>()
	const [approving, setApproving] = React.useState(false)
	const wc = React.useRef<WCV1 | undefined>()
	const onCancel = props.onCancel
	React.useEffect(() => {
		log.info(`wallet-connect: pairing with ${uri}...`)
		const sessionId = newSessionStorageId()
		wc.current = new WCV1(sessionId, new WalletConnect({
			uri: uri,
			clientMeta: celoTerminalMetadata,
			storageId: sessionId,
		}))
		let cancelled = false
		wc.current.wc.on("session_request", async (error, proposal) => {
			log.info(`wallet-connect: proposal received (cancelled: ${cancelled})...`, error, proposal)
			if ((error || cancelled)) {
				return wc.current?.disconnect()
			}
			setProposal(proposal.params[0])
		})
		return () => { cancelled = true }
	// NOTE(zviadm): This only needs to run once.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	const handleCancel = () => {
		if (wc.current) {
			wc.current.disconnect()
		}
		onCancel()
	}
	const handleApprove = () => {
		if (!proposal || !wc.current) {
			return
		}
		setApproving(true)
		wc.current.wc.approveSession({
			chainId: Number.parseInt(CFG().chainId),
			accounts: [props.account.address],
		})
		props.onApprove(wc.current)
	}

	const icon = proposal?.peerMeta.icons[0]

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
							<Link href={proposal.peerMeta.url}>
								{proposal.peerMeta.name}
							</Link>
						}
					/>
					<CardContent>
						<Typography variant="body2" color="textSecondary" component="p">
							{proposal.peerMeta.description}
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
