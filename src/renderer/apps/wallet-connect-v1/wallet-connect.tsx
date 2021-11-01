import log from 'electron-log'
import { CeloTxReceipt, EncodedTransaction } from '@celo/connect'
import WC from 'wcv1/client'
import SessionStorage from "@walletconnect/core/dist/esm/storage"

import { Account } from '../../../lib/accounts/accounts'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'
import { WalletConnect } from './def'

import * as React from 'react'
import {
	Button, List, TextField,
	ListItem, ListItemText, ListItemSecondaryAction, Badge
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import AlertTitle from '@material-ui/lab/AlertTitle'
import SendIcon from '@material-ui/icons/Send'

import AppHeader from '../../components/app-header'
import AppSection from '../../components/app-section'
import AppContainer from '../../components/app-container'
import SectionTitle from '../../components/section-title'
import Link from '../../components/link'
import WCSession from './wc-session'
import EstablishSession from './establish-session'
import { runWithInterval } from '../../../lib/interval'
import { removeSessionId, storedSessionIds, wipeFullStorage } from './storage'
import { requestQueueGlobal, setupWCHandlers } from './client';

const WalletConnectApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [sessions, setSessions] = React.useState<{wc: WC}[]>([])
	const [requests, setRequests] = React.useState([...requestQueueGlobal])

	// Initialize WalletConnect sessions from localStorage.
	React.useEffect(() => {
		const sessionIds = storedSessionIds()
		log.info(`wallet-connect: loading stored sessions`, sessionIds)
		const wcs: {wc: WC}[] = []
		sessionIds.forEach((sessionId) => {
			try {
				const storage = new SessionStorage(sessionId)
				const session = storage.getSession()
				if (!session) {
					removeSessionId(sessionId)
					return
				}
				const wc = new WC({ session, storageId: sessionId })
				wcs.push({ wc })
			} catch (e) {
				removeSessionId(sessionId)
				log.error(`wallet-connect: removing uninitialized session`, sessionId, e)
			}
		})
		setSessions(wcs)
	}, [])

	// Run periodic checks to discard disconnected sessions and to handle new
	// WalletConnect requests.
	React.useEffect(() => {
		const cancel = runWithInterval(
			"wallet-connect",
			async () => {
				setRequests((reqs) => {
					const requestsUpdated = (
						reqs.length !== requestQueueGlobal.length ||
						!reqs.every((r, idx) => r === requestQueueGlobal[idx])
					)
					return requestsUpdated ? [...requestQueueGlobal] : reqs
				})
				setSessions((sessions) => {
					const sessionsFiltered = sessions.filter((s) => s.wc.connected)
					return (sessionsFiltered.length !== sessions.length) ? sessionsFiltered : sessions
				})
			},
			500)
		return cancel
	}, [])


	const accounts = props.accounts
	// Discard all requests that are sent for an incorrect/unknown accounts.
	React.useEffect(() => {
		for (const request of requestQueueGlobal) {
			const from = request.request.params?.from?.toString().toLowerCase()
			const match = accounts.find((a) => a.address.toLowerCase() === from)
			if (!match) {
				request.reject({message: `Unknown account: ${request.request.params?.from}`})
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
		const request = requestQueueGlobal.find((r) =>
			r.request.params?.from?.toString().toLowerCase() === account.address.toLowerCase())
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
					request.reject({
						code: -32000,
						message: e.message,
					})
				} else {
					if (request.request.method === "eth_signTransaction") {
						if (signedTXs?.length !== 1) {
							const errMsg = `Unexpected error while performing eth_signTransaction!`
							request.reject({code: -32000, message: errMsg})
							throw new Error(errMsg)
						}
						request.approve(signedTXs[0])
					} else {
						if (receipts?.length !== 1) {
							const errMsg = `Unexpected error while performing eth_sendTransaction!`
							request.reject({code: -32000, message: errMsg})
							throw new Error(errMsg)
						}
						// TODO(zviad): What is the appropriate result for performed TXs?
						request.approve()
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
	}
	const handleApprove = (wc: WC) => {
		setSessions((sessions) => ([...sessions, {wc: wc}]))
		refreshAfterEstablish()
		setupWCHandlers(wc)
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
			<EstablishSession
				uri={toApproveURI}
				account={props.selectedAccount}
				onCancel={refreshAfterEstablish}
				onApprove={handleApprove}
			/>}
			<AppSection>
				<Alert severity="warning">
					<AlertTitle>EXPERIMENTAL: WalletConnect v1</AlertTitle>
					WalletConnect support is still under development in Celo network. This is an
					experimental feature for now. <Link href="https://docs.celoterminal.com/guides/using-walletconnect">Learn More.</Link>
				</Alert>
			</AppSection>
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
					placeholder="ws:..."
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
					.map((s) => {
					if (!s.wc.session.peerMeta) {
						return <></>
					}
					return <WCSession
						key={s.wc.peerId}
						metadata={s.wc.session.peerMeta}
						onDisconnect={() => {
							s.wc.killSession()
							const removeWC = s.wc
							setSessions((sessions) => sessions.filter((s) => s.wc !== removeWC))
						}}
					/>
				})}
				</List>
				<Button
					variant="outlined"
					color="secondary"
					onClick={() => {
						for (const wc of sessions) {
							wc.wc.killSession()
						}
						wipeFullStorage()
						setSessions([])
						requestQueueGlobal.splice(0, requestQueueGlobal.length)
					}}>
					Disconnect all DApps and reset state
				</Button>
			</AppSection>
		</AppContainer>
	)
}
export default WalletConnectApp
