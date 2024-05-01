import { Account } from '../../../lib/accounts/accounts'
import { SignatureResponse, TXFinishFunc, TXFunc } from '../../components/app-definition'
import { WalletConnect } from './def'

import WCSession from './wc-session'
import { runWithInterval } from '../../../lib/interval'
import { throwUnreachableError } from '../../../lib/utils'
import { ISession } from './session'
import { RequestQueue, requestQueueGlobal } from './request-queue'

import EstablishSessionV2 from './v2/establish-session'

import { parseUri } from '@walletconnect/utils'

import * as React from 'react'
import {
	Button, List, TextField,
	ListItem, ListItemText, ListItemSecondaryAction, Badge, LinearProgress
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import SendIcon from '@material-ui/icons/Send'

import AppHeader from '../../components/app-header'
import AppSection from '../../components/app-section'
import AppContainer from '../../components/app-container'
import SectionTitle from '../../components/section-title'

const WalletConnectApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [rq, setRQ] = React.useState<RequestQueue | null>(null)
	const [sessions, _setSessions] = React.useState(rq?.sessionsSnapshot([]))
	const [requests, _setRequests] = React.useState(rq?.requestsSnapshot([]))

	React.useEffect(() => {
		if (!rq) {
			requestQueueGlobal().then((r) => {setRQ(r)})
		}
	}, [rq, setRQ])

	// Initialize WalletConnect sessions from localStorage.
	const refreshSessions = React.useCallback(() => {
		_setSessions((sessions) => {
			return rq?.sessionsSnapshot(sessions || [])
		})
	}, [rq])
	const refreshRequests = React.useCallback(() => {
		_setRequests((requests) => {
			return rq?.requestsSnapshot(requests || [])
		})
	}, [rq])

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
		if (!requests) {
			return
		}
		for (const request of requests) {
			const from = request.request.params?.from?.toString().toLowerCase()
			const match = accounts.find((a) => a.address.toLowerCase() === from)
			if (!match) {
				rq?.reject(request, {
					code: -32000,
					message: `Unknown account: ${request.request.params?.from}`,
				})
			}
		}
	}, [rq, requests, accounts])

	const [inProgress, setInProgress] = React.useState(false)
	const account = props.selectedAccount
	const runTXs = props.runTXs
	React.useEffect(() => {
		if (inProgress) {
			return
		}
		const request = rq?.requestFor(account.address)
		if (!request) {
			return
		}
		setInProgress(true)
		runTXs(
			async () => {
				switch (request.request.method) {
					case "eth_signTransaction":
					case "eth_sendTransaction":
						return [{tx: request.request.method, params: request.request.params}]
					case "eth_signPersonal":
						return [{type: "signPersonal", params: request.request.params}]
					case "eth_signTypedData_v4":
						return [{type: "signTypedData_v4", params: request.request.params}]
					default: throwUnreachableError(request.request)
				}
			},
			(e?: Error, r?: SignatureResponse[]) => {
				setInProgress(false)
				if (e) {
					rq?.reject(request, {
						code: -32000,
						message: e.message,
					})
				} else {
					if (r?.length !== 1) {
						const errMsg = `Unexpected error while performing ${request.request.method}!`
						rq?.reject(request, {code: -32000, message: errMsg})
						throw new Error(errMsg)
					}
					switch (r[0].type) {
						case "eth_signTransaction":
							rq?.approve(request, r[0].encodedTX)
							break
						case "eth_sendTransaction":
							rq?.approve(request, r[0].receipt.transactionHash)
							break
						case "eth_signPersonal":
							rq?.approve(request, r[0].encodedData)
							break
						case "eth_signTypedData_v4":
							rq?.approve(request, r[0].encodedData)
							break
						default: throwUnreachableError(r[0])
					}
				}
			}
		)
	}, [rq, inProgress, requests, account, runTXs])

	const [connectURI, setConnectURI] = React.useState("")
	const [toApproveURI, setToApproveURI] = React.useState("")
	const parsedURI = parseUri(toApproveURI)

	const refreshAfterEstablish = () => {
		setConnectURI("")
		setToApproveURI("")
		refreshSessions()
	}
	const handleApprove = (s: ISession) => {
		rq?.addSession(s)
		refreshAfterEstablish()
	}
	const handleDisconnect = (s: ISession) => {
		s.disconnect()
		refreshSessions()
	}
	const handleDisconnectAll = () => {
		rq?.resetAndRejectAll()
		refreshSessions()
	}

	const requestsByAccount = new Map<string, number>()
	requests?.forEach((r) => {
		const from = r.request.params?.from?.toString().toLowerCase() as string || ""
		requestsByAccount.set(from, (requestsByAccount.get(from) || 0) + 1)
	})

	if (!rq) {
		return (
			<AppContainer>
				<AppHeader app={WalletConnect} />
				<AppSection>
					<LinearProgress color="primary" />
				</AppSection>
			</AppContainer>
		)
	}

	return (
		<AppContainer>
			<AppHeader app={WalletConnect} />
			{parsedURI.version === 1 /* TODO: show error */}
			{parsedURI.version === 2 &&
			<EstablishSessionV2
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
				{(sessions || [])
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
