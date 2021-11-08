import { CeloTxReceipt, EncodedTransaction } from '@celo/connect'

import { Account } from '../../../lib/accounts/accounts'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'
import { WalletConnect } from './def'

import * as React from 'react'
import {
	Button, List, TextField,
	ListItem, ListItemText, ListItemSecondaryAction, Badge
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import SendIcon from '@material-ui/icons/Send'

import AppHeader from '../../components/app-header'
import AppSection from '../../components/app-section'
import AppContainer from '../../components/app-container'
import SectionTitle from '../../components/section-title'
import WCSession from './wc-session'
import { runWithInterval } from '../../../lib/interval'
import { ISession } from './session'
import { requestQueueGlobal } from './request-queue'

import EstablishSessionV1 from './v1/establish-session'

if (module.hot) {
	module.hot.decline()
}

const WalletConnectApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [sessions, _setSessions] = React.useState(requestQueueGlobal().sessionsSnapshot([]))
	const [requests, _setRequests] = React.useState(requestQueueGlobal().requestsSnapshot([]))

	// Initialize WalletConnect sessions from localStorage.
	const refreshSessions = React.useCallback(() => {
		_setSessions((sessions) => {
			return requestQueueGlobal().sessionsSnapshot(sessions)
		})
	}, [])
	const refreshRequests = React.useCallback(() => {
		_setRequests((requests) => {
			return requestQueueGlobal().requestsSnapshot(requests)
		})
	}, [])

	// Run periodic checks to discard disconnected sessions and to handle new
	// WalletConnect requests.
	React.useEffect(() => {
		const cancel = runWithInterval(
			"wallet-connect",
			async () => {
				refreshRequests()
				refreshSessions()
			},
			500)
		return cancel
	}, [refreshRequests, refreshSessions])

	const accounts = props.accounts
	// Discard all requests that are sent for an incorrect/unknown accounts.
	React.useEffect(() => {
		for (const request of requests) {
			const from = request.request.params?.from?.toString().toLowerCase()
			const match = accounts.find((a) => a.address.toLowerCase() === from)
			if (!match) {
				requestQueueGlobal().reject(request, {
					code: -32000,
					message: `Unknown account: ${request.request.params?.from}`,
				})
			}
		}
	}, [requests, accounts])

	const [inProgress, setInProgress] = React.useState(false)
	const account = props.selectedAccount
	const runTXs = props.runTXs
	React.useEffect(() => {
		if (inProgress) {
			return
		}
		const request = requestQueueGlobal().requestFor(account.address)
		if (!request) {
			return
		}
		setInProgress(true)
		runTXs(
			async () => {
				return [{tx: request.request.method, params: request.request.params}]
			},
			(e?: Error, receipts?: CeloTxReceipt[], signedTXs?: EncodedTransaction[]) => {
				setInProgress(false)
				if (e) {
					requestQueueGlobal().reject(request, {
						code: -32000,
						message: e.message,
					})
				} else {
					if (request.request.method === "eth_signTransaction") {
						if (signedTXs?.length !== 1) {
							const errMsg = `Unexpected error while performing eth_signTransaction!`
							requestQueueGlobal().reject(request, {code: -32000, message: errMsg})
							throw new Error(errMsg)
						}
						requestQueueGlobal().approve(request, signedTXs[0])
					} else {
						if (receipts?.length !== 1) {
							const errMsg = `Unexpected error while performing eth_sendTransaction!`
							requestQueueGlobal().reject(request, {code: -32000, message: errMsg})
							throw new Error(errMsg)
						}
						requestQueueGlobal().approve(request, receipts[0].transactionHash)
					}
				}
			}
		)
	}, [inProgress, requests, account, runTXs])

	const [connectURI, setConnectURI] = React.useState("")
	const [toApproveURI, setToApproveURI] = React.useState("")

	const refreshAfterEstablish = () => {
		setConnectURI("")
		setToApproveURI("")
		refreshSessions()
	}
	const handleApprove = (s: ISession) => {
		requestQueueGlobal().addSession(s)
		refreshAfterEstablish()
	}
	const handleDisconnect = (s: ISession) => {
		s.disconnect()
		refreshSessions()
	}
	const handleDisconnectAll = () => {
		requestQueueGlobal().resetAndRejectAll()
		refreshSessions()
	}

	const requestsByAccount = new Map<string, number>()
	requests.forEach((r) => {
		const from = r.request.params?.from?.toString().toLowerCase() as string || ""
		requestsByAccount.set(from, (requestsByAccount.get(from) || 0) + 1)
	})

	return (
		<AppContainer>
			<AppHeader app={WalletConnect} />
			{toApproveURI !== "" &&
			<EstablishSessionV1
				uri={toApproveURI}
				account={props.selectedAccount}
				onCancel={refreshAfterEstablish}
				onApprove={handleApprove}
			/>}
			{requestsByAccount.size > 0 &&
			<AppSection>
				<Alert severity="info" style={{marginTop: 10}}>
					Switch account using the account selector drop-down to sign pending transactions.
				</Alert>
				<List>
				{props.accounts
					.filter((a) => requestsByAccount.get(a.address.toLowerCase()))
					.map((a) => {
						const requestsN = requestsByAccount.get(a.address.toLowerCase())
						return (
							<ListItem key={a.address}>
								<ListItemText
									primary={a.name}
									secondary={a.address}
								/>
								<ListItemSecondaryAction>
								<Badge color="secondary" badgeContent={requestsN}>
									<SendIcon />
								</Badge>
								</ListItemSecondaryAction>
							</ListItem>
						)
					})
				}
				</List>
			</AppSection>
			}
			<AppSection>
				<TextField
					autoFocus
					label="QRCode (Copy & Paste from the DApp)"
					InputLabelProps={{shrink: true}}
					multiline={true}
					placeholder="wc:..."
					size="medium"
					fullWidth={true}
					spellCheck={false}
					value={connectURI}
					inputProps={{style: {fontFamily: "monospace", wordBreak: "break-all"}}}
					onChange={(e) => { setConnectURI(e.target.value) }}
				/>

				<Button
					onClick={() => { setToApproveURI(connectURI) }}
					disabled={connectURI === ""}
					>Connect</Button>
			</AppSection>
			<AppSection>
				<SectionTitle>Connected DApps</SectionTitle>
				<List>
				{sessions
					.map((s, idx) => {
					const metadata = s.metadata()
					if (!metadata) {
						return <></>
					}
					return <WCSession
						key={`session-${idx}`}
						accounts={props.accounts}
						metadata={metadata}
						onDisconnect={() => { return handleDisconnect(s) }}
					/>
				})}
				</List>
				<Button
					variant="outlined"
					color="secondary"
					onClick={handleDisconnectAll}
				>
					Disconnect all DApps and reset state
				</Button>
			</AppSection>
		</AppContainer>
	)
}
export default WalletConnectApp
