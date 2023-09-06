import * as log from 'electron-log'

import { Account } from '../../../../lib/accounts/accounts'
import { CFG } from '../../../../lib/cfg'
import { ISession } from '../session'
import { UserError } from '../../../../lib/error'
import { SessionWrapper, wcGlobal } from './wc'

import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils'
import { ProposalTypes } from "@walletconnect/types";

import * as React from 'react'
import {
	Avatar,
	Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Typography
} from '@material-ui/core'
import Link from '../../../components/link'

interface ProposalRequest {
	id: number
	params: ProposalTypes.Struct
}

const EstablishSession = (props: {
	uri: string,
	account: Account,
	onCancel: () => void,
	onApprove: (wc: ISession) => void,
}): JSX.Element => {
	const uri = props.uri
	const [proposal, setProposal] = React.useState<ProposalRequest | undefined>()
	const [approving, setApproving] = React.useState(false)
	const onCancel = props.onCancel
	React.useEffect(() => {
		log.info(`wallet-connect: pairing with ${uri}...`)
		let cancelled = false
		try {
			const wc = wcGlobal.wc()
			const l = async (proposal: ProposalRequest) => {
				log.info(`wallet-connect: proposal received (cancelled: ${cancelled})...`, proposal)
				if (cancelled) {
					wc.rejectSession({id: proposal.id, reason: getSdkError("USER_REJECTED_METHODS")})
					return
				}
				setProposal(proposal)
			}
			wc.once("session_proposal", l)
			wc.pair({uri})
		} catch (e) {
			onCancel()
			setTimeout(() => { throw new UserError(`WalletConnect Error: ${e}`) })
		}
		return () => { cancelled = true }
	// NOTE(zviadm): This only needs to run once.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	const handleCancel = () => {
		onCancel()
	}
	const handleApprove = () => {
		if (!proposal) {
			return
		}
		setApproving(true)
		try {
			const chainId = `eip155:${CFG().chainId}`
			const namespaces = buildApprovedNamespaces({
				proposal: proposal.params,
				supportedNamespaces: {
					eip155: {
						// NOTE(zviad): There are a lot of buggy dApps that are requesting eip155:1 chain permissions
						// even when there is no need for it. Adding it here is safe since we have many other checks to
						// make sure we don't perform actions for an incorrect chainId.
						chains: ["eip155:1", chainId],
						methods: [
							"eth_sendTransaction",
							"eth_signTransaction",
							"personal_sign",
							"eth_signTypedData_v4"],
						events: ["chainChanged", "accountsChanged"],
						accounts: [`eip155:1:${props.account.address}`, `${chainId}:${props.account.address}`],
					}
				}
			})
			wcGlobal.wc().approveSession({
				id: proposal.id,
				namespaces,
			})
			.then(session => props.onApprove(new SessionWrapper(session)))
			.catch((e) => {
				onCancel()
				throw new UserError(`WalletConnect Error: ${e}`)
			})
		} catch (e) {
			onCancel()
			setTimeout(() => { throw new UserError(`WalletConnect Error: ${e}`) })
		}
	}

	const icon = proposal?.params.proposer.metadata.icons[0]

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
							<Link href={proposal.params.proposer.metadata.url}>
								{proposal.params.proposer.metadata.name}
							</Link>
						}
					/>
					<CardContent>
						<Typography variant="body2" color="textSecondary" component="p">
							{proposal.params.proposer.metadata.description}
						</Typography>
					</CardContent>
					<CardContent>
						<Typography variant="body2" color="textSecondary" component="pre">
							Namespaces: {JSON.stringify(proposal.params.requiredNamespaces, undefined, 2)}
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
