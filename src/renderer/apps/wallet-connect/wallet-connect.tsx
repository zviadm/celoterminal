import { CeloTx, CeloTxReceipt, EncodedTransaction } from '@celo/connect'
import { SessionTypes } from '@walletconnect/types'
import { CLIENT_EVENTS } from '@walletconnect/client'

import { Account } from '../../../lib/accounts/accounts'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'
import { WalletConnect } from './def'
import { wcGlobal } from './client'

import * as React from 'react'
import {
	Button, LinearProgress, List, TextField, ListItem, ListItemText, ListItemSecondaryAction, Badge
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import AlertTitle from '@material-ui/lab/AlertTitle'
import SendIcon from '@material-ui/icons/Send'

import AppHeader from '../../components/app-header'
import AppSection from '../../components/app-section'
import AppContainer from '../../components/app-container'
import SectionTitle from '../../components/section-title'
import WCSession from './wc-session'
import EstablishSession from './establish-session'

const WalletConnectApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [initState, setInitState] = React.useState<"initializing" | "initialized" | "error">("initializing")
	const [initError, setInitError] = React.useState<Error | undefined>()
	const [sessions, setSessions] = React.useState<SessionTypes.Settled[]>([])

	React.useEffect(() => {
		if (initState !== "initializing") {
			return
		}
		let cancelled = false
		;(async () => {
			const wc = await wcGlobal.init()
			if (!cancelled) {
				wc.on(CLIENT_EVENTS.session.created, () => {
					setSessions([...wc.session.values])
				})
				wc.on(CLIENT_EVENTS.session.deleted, () => {
					setSessions([...wc.session.values])
				})
				setSessions([...wc.session.values])
				setInitState("initialized")
			}
		})()
		.catch((e) => {
			if (!cancelled) {
				setInitState("error")
				setInitError(e)
			}
			throw e
		})
		return () => { cancelled = true }
	}, [initState])
	React.useEffect(() => {
		return () => {
			const wc = wcGlobal.wcMaybe()
			if (!wc) { return }
			wc.events.removeAllListeners(CLIENT_EVENTS.session.created)
			wc.events.removeAllListeners(CLIENT_EVENTS.session.deleted)
		}
	}, [])

	const [requests, setRequests] = React.useState([...wcGlobal.requests])
	React.useEffect(() => {
		const _update = () => {
			setRequests((reqs) => {
				const requestsUpdated = (
					reqs.length !== wcGlobal.requests.length ||
					!reqs.every((r, idx) => r === wcGlobal.requests[idx])
				)
				return requestsUpdated ? [...wcGlobal.requests] : reqs
			})
		}
		const t = setInterval(_update, 500)
		return () => { clearInterval(t) }
	}, [])
	const accounts = props.accounts
	React.useEffect(() => {
		for (const request of wcGlobal.requests) {
			const from = request.request.params?.from?.toLowerCase()
			const match = accounts.find((a) => a.address.toLowerCase() === from)
			if (!match) {
				wcGlobal.reject(request, {
					code: -32000,
					message: `Unknown account: ${from}`,
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
		const request = wcGlobal.requests.find((r) =>
			r.request.params?.from?.toLowerCase() === account.address.toLowerCase())
		if (!request) {
			return
		}
		setInProgress(true)
		runTXs(
			async () => {
				const tx: CeloTx = request.request.params
				return [{tx: "eth_signTransaction", params: tx}]
			},
			(e?: Error, receipts?: CeloTxReceipt[], signedTXs?: EncodedTransaction[]) => {
				setInProgress(false)
				if (e) {
					wcGlobal.reject(request, {
						code: -32000,
						message: e.message,
						data: `${e}`,
					})
				} else {
					if (!signedTXs) {
						throw new Error(`Unexpected Error!`)
					}
					wcGlobal.respond(request, signedTXs[0])
				}
			}
		)
	}, [inProgress, requests, account, runTXs])

	const [connectURI, setConnectURI] = React.useState("")
	const [toApproveURI, setToApproveURI] = React.useState("")

	const refresh = () => {
		if (initState === "error") {
			setInitState("initializing")
		} else if (initState === "initialized") {
			setSessions([...wcGlobal.wc().session.values])
		}
	}

	const refreshAfterEstablish = () => {
		setConnectURI("")
		setToApproveURI("")
	}

	const requestsByAccount = new Map<string, number>()
	requests.forEach((r) => {
		const from = r.request.params?.from?.toLowerCase() as string || ""
		requestsByAccount.set(from, (requestsByAccount.get(from) || 0) + 1)
	})

	return (
		<AppContainer>
			<AppHeader app={WalletConnect} isFetching={initState === "initializing"} refetch={refresh} />
			{toApproveURI !== "" &&
			<EstablishSession
				uri={toApproveURI}
				account={props.selectedAccount}
				onCancel={refreshAfterEstablish}
				onApprove={refreshAfterEstablish}
			/>}
			<AppSection>
				<Alert severity="warning">
					<AlertTitle>EXPERIMENTAL</AlertTitle>
					WalletConnect support is still under development in Celo network. This is an
					experimental feature for now.
				</Alert>
				{initState === "initializing" && <LinearProgress />}
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
			{initState === "error" && initError &&
			<AppSection>
				<Alert severity="error">
					<AlertTitle>WalletConnect</AlertTitle>
					{initError.message}
				</Alert>
			</AppSection>}
			{initState === "initialized" && <>
			<AppSection>
				<TextField
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
			{sessions.length > 0 &&
			<AppSection>
				<SectionTitle>Connected DApps</SectionTitle>
				<List>
				{sessions
					.map((s) => {
					return <WCSession
						key={s.topic}
						session={s}
					/>
				})}
				</List>
			</AppSection>}
			</>}
		</AppContainer>
	)
}
export default WalletConnectApp
