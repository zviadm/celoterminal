import log from 'electron-log'

import { SignatureResponse, TXFinishFunc, TXFunc } from '../../components/app-definition'
import { EstimatedFee, estimateGas } from './fee-estimation'
import { ParsedSignatureRequest, parseSignatureRequest } from './transaction-parser'
import { rootAccount, Wallet } from './wallet'
import { CFG } from '../../../lib/cfg'
import { nowMS } from '../../state/time'
import { sleep, throwUnreachableError } from '../../../lib/utils'
import { transformError } from '../ledger-utils'
import { Account } from '../../../lib/accounts/accounts'
import { cfgNetworkURL, newKitWithTimeout } from '../../state/kit'

import * as React from 'react'
import {
	makeStyles, Dialog, DialogContent, DialogActions,
	Paper, Box, Typography, LinearProgress, List, ListItem, ListItemIcon,
	Button, ListItemText
} from '@material-ui/core'
import Send from '@material-ui/icons/Send'
import CheckCircle from '@material-ui/icons/CheckCircle'

import PromptLedgerAction from './prompt-ledger-action'
import { runWithInterval } from '../../../lib/interval'
import BigNumber from 'bignumber.js'
import SignatureRequestInfo from './signature-request-info'
import SignatureRequestTitle from './signature-request-title'
import { monospaceFont } from '../../styles'
import { E2ETestChainId } from '../../../lib/e2e-constants'
import { FeeToken, selectFeeToken } from '../../../lib/fee-tokens'
import Erc20Contract from '../../../lib/erc20/erc20-contract'
import { CeloTx } from '@celo/connect'
import { UserError } from '../../../lib/error'
import { coreErc20Decimals } from '../../../lib/erc20/core'

export class TXCancelled extends Error {
	constructor() { super('Cancelled') }
}

const useStyles = makeStyles((theme) => ({
	root: {
		minWidth: 600,
	},
	progressText: {
		fontStyle: "italic",
	},
	successText: {
		fontStyle: "italic",
		color: theme.palette.success.main,
	},
	address: {
		...monospaceFont,
		fontSize: theme.typography.body2.fontSize,
	},
}))

const RunTXs = (props: {
	selectedAccount: Account,
	accounts: Account[],
	wallet: Wallet,
	txFunc: TXFunc,
	onFinish: TXFinishFunc,
}): JSX.Element => {
	const classes = useStyles()
	const [preparedReqs, setPreparedReqs] = React.useState<ParsedSignatureRequest[]>([])
	const [currentReq, setCurrentReq] = React.useState<{
		idx: number,
		estimatedFee: EstimatedFee,
		confirm: () => void,
		cancel: () => void,
	} | undefined>()
	const [stage, setStage] = React.useState<
		"preparing" |
		"confirming" |
		"sending" |
		"finishing">("preparing")
	const [reqSendMS, setReqSendMS] = React.useState(0)

	const txFunc = props.txFunc
	const onFinish = props.onFinish
	const executingAccount = rootAccount(props.selectedAccount, props.accounts)
	const w = props.wallet
	React.useEffect(() => {
		(async () => {
			let onFinishErr: Error | undefined
			const r: SignatureResponse[] = []
			try {
				const cfg = CFG()
				if (cfg.chainId !== E2ETestChainId) {
					// NOTE: see comment in `createWallet` about limitations of celo-devchain.
					const accounts = w.wallet.getAccounts()
					if (accounts.length !== 1 ||
						accounts[0].toLowerCase() !== executingAccount.address.toLowerCase()) {
						throw new Error(
							`Unexpected Account. Expected: ${executingAccount.address}, Got: ${accounts[0]}. ` +
							`Refusing to run transactions.`)
					}
				}
				const kit = newKitWithTimeout(cfgNetworkURL({ withFornoKey: true }), w.wallet)
				let feeToken: FeeToken = "auto" // TODO(zviadm): Make this configurable/selectable by user.
				kit.defaultAccount = executingAccount.address as `0x${string}`
				try {
					const chainId = (await kit.web3.eth.getChainId()).toString()
					if (chainId !== cfg.chainId) {
						throw new Error(
							`Unexpected ChainId. Expected: ${cfg.chainId}, Got: ${chainId}. ` +
							`Refusing to run transactions.`)
					}
					if (feeToken === "auto") {
						feeToken = await selectFeeToken(kit, executingAccount.address)
					}
					let paramsFilled: CeloTx | null = null

					const reqs = await txFunc(kit)
					if (reqs.length === 0) {
						throw new Error(`No requests to sign or run.`)
					}
					const parsedReqs: ParsedSignatureRequest[] = []
					for (const req of reqs) {
						const parsedReq = await parseSignatureRequest(kit, req)
						parsedReqs.push(parsedReq)
					}
					setPreparedReqs(parsedReqs)

					for (let idx = 0; idx < reqs.length; idx += 1) {
						let req = reqs[idx]
						if (w.transformReq) {
							req = await w.transformReq(kit, req)
						}
						let estimatedFee: EstimatedFee
						switch (req.type) {
							case undefined: {
								paramsFilled = {}
								if (req.tx !== "eth_signTransaction" && req.tx !== "eth_sendTransaction") {
									paramsFilled = { ...paramsFilled, ...req.tx.defaultParams }
								}
								if (req.params) {
									paramsFilled = { ...paramsFilled, ...req.params }
								}
								if (!paramsFilled.feeCurrency && !paramsFilled.maxFeePerGas && !paramsFilled.gasPrice) {
									paramsFilled.feeCurrency = feeToken.address
									if (paramsFilled.gas && feeToken.address) {
										// we need to adjust estimated gas, because we are using custom fee currency which
										// has additional Gas overhead
										paramsFilled.gas = "0x" + new BigNumber(paramsFilled.gas).plus(50_000).toString(16)
									}
								}
								paramsFilled = await kit.connection.setFeeMarketGas(paramsFilled)
								const estimatedGas = await estimateGas(kit, req, paramsFilled)
								paramsFilled.gas = "0x" + estimatedGas.toString(16)

								let feeSymbol: string
								let feeDecimals: number
								if (!paramsFilled.feeCurrency) {
									feeSymbol = "CELO"
									feeDecimals = coreErc20Decimals
								} else {
									const erc20 = new Erc20Contract(kit, paramsFilled.feeCurrency);
									[feeSymbol, feeDecimals] = await Promise.all([
										erc20.symbol(),
										erc20.decimals(),
									])
								}
								estimatedFee = {
									estimatedGas,
									feeCurrency: feeSymbol,
									estimatedFee: estimatedGas.multipliedBy(paramsFilled.maxFeePerGas!.toString()).shiftedBy(-feeDecimals),
								}
								break
							}
							default: {
								estimatedFee = {
									estimatedGas: new BigNumber(0),
									feeCurrency: "CELO",
									estimatedFee: new BigNumber(0),
								}
							}
						}

						const txPromise = new Promise<void>((resolve, reject) => {
							setCurrentReq({
								idx: idx,
								estimatedFee: estimatedFee,
								confirm: () => {
									setStage("sending")
									resolve()
								},
								cancel: () => {
									setStage("sending")
									reject(new TXCancelled())
								}
							})
						})
						log.info(`REQ:`, req)

						setReqSendMS(0)
						setReqProgress(0)
						setStage("confirming")
						if (executingAccount.type === "local") {
							// Only need to show confirmation dialog for Local accounts.
							await txPromise
							setStage("sending")
							setReqSendMS(nowMS())
						}

						switch (req.type) {
							case undefined: {
								if (paramsFilled === null) {
									throw new Error(`Unexpected error: TX parameters not found!`)
								}
								if (req.tx === "eth_signTransaction" || req.tx === "eth_sendTransaction") {
									if (!new BigNumber(paramsFilled.chainId || 0).eq(cfg.chainId)) {
										throw new UserError(
											`Unexpected ChainId. Expected: ${cfg.chainId}, Got: ${paramsFilled.chainId}. ` +
											`Refusing to ${req.tx}.`)
									}
								}
								if (req.tx === "eth_signTransaction") {
									const encodedTX = await w.wallet.signTransaction(paramsFilled)
									r.push({ type: "eth_signTransaction", encodedTX })
								} else {
									let result
									if (req.tx === "eth_sendTransaction") {
										result = await kit.sendTransaction(paramsFilled)
									} else {
										result = await req.tx.send(paramsFilled)
									}
									let txHash
									try {
										txHash = await result.getHash()
									} catch (e) {
										if ((e as Error)?.message?.includes("already known") ||
											(e as Error)?.message?.includes("nonce too low")) {
											throw new Error(
												`Transaction was aborted due to a potential conflict with another concurrent transaction. ${e}.`)
										}
										if ((e as Error)?.message?.includes("Invalid JSON RPC response")) {
											throw new Error(
												`Timed out while trying to send the transaction. ` +
												`Transaction might have been sent and might get processed anyways. ` +
												`Wait a bit before retrying to avoid performing your transaction twice.`)
										}
										if ((e as Error)?.message?.includes("Ledger device:")) {
											throw e
										}
										throw new Error(
											`Unexpected error occured while trying to send the transaction. ` +
											`Transaction might have been sent and might get processed anyways. ${e}.`)
									}
									log.info(`TX-HASH:`, txHash)
									// TODO(zviadm): For non-local wallets need to somehow intercept when signing is complete.
									if (executingAccount.type !== "local") {
										setStage("sending")
										setReqSendMS(nowMS())
									}
									const receipt = await result.waitReceipt()
									setReqProgress(100)
									log.info(`TX-RECEIPT:`, receipt)
									r.push({ type: "eth_sendTransaction", receipt })
								}
								break
							}
							case "signPersonal": {
								const encodedData = await w.wallet.signPersonalMessage(req.params.from, req.params.data)
								r.push({ type: "eth_signPersonal", encodedData })
								break
							}
							case "signTypedData_v4": {
								const encodedData = await w.wallet.signTypedData(req.params.from, JSON.parse(req.params.data))
								r.push({ type: "eth_signTypedData_v4", encodedData })
								break
							}
							default: throwUnreachableError(req)
						}
					}
					setStage("finishing")
					// Wait a bit after final TX so that it is more likely that blockchain state
					// is now updated in most of the full nodes.
					await sleep(500)
				} finally {
					kit.stop()
					if (w.transport) {
						await w.transport.close()
					}
				}
			} catch (e) {
				onFinishErr = transformError(e as Error)
			} finally {
				onFinish(onFinishErr, r)
			}
		})()
		// NOTE: This effect is expected to run only once on first render and it is expected
		// that parent will unmount the component once it calls onFinish.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	const [reqProgress, setReqProgress] = React.useState(0)
	React.useEffect(() => {
		if (stage !== "sending") {
			return
		}
		const cancel = runWithInterval(
			"coreapp-tx-progress",
			async () => {
				const expectedBlockMs = 2000
				const progress = (
					reqSendMS === 0 ? 0 : Math.min(99, (nowMS() - reqSendMS) / expectedBlockMs * 100.0))
				setReqProgress((reqProgress) => Math.max(progress, reqProgress))
			},
			200)
		return cancel
	}, [stage, reqSendMS]);

	return (
		<Dialog
			id="tx-runner-modal"
			open={true}>
			<DialogContent className={classes.root}>
				<Box display="flex" flexDirection="column">
					{
						stage === "preparing" || !currentReq ?
							<>
								<Typography className={classes.progressText}>Preparing requests...</Typography>
								<LinearProgress color="primary" />
							</>
							:
							<>
								<Paper>
									<List dense={true}>
										{preparedReqs.map((req, idx) => (
											<ListItem key={`${idx}`}>
												<ListItemIcon>
													{
														(idx < currentReq.idx || stage === "finishing") ?
															<CheckCircle /> :
															(idx === currentReq.idx) ? <Send /> : <></>
													}
												</ListItemIcon>
												<ListItemText primary={
													<Typography className={classes.address}>
														<SignatureRequestTitle req={preparedReqs[idx]} />
													</Typography>
												} />
											</ListItem>
										))}
									</List>
								</Paper>
								<Box marginTop={1}>
									<SignatureRequestInfo req={preparedReqs[currentReq.idx]} fee={currentReq.estimatedFee} />
								</Box>
								<Box marginTop={1}>
									<LinearProgress
										style={{ visibility: stage === "confirming" ? "hidden" : undefined }}
										color="primary"
										variant="determinate"
										value={reqProgress}
									/>
								</Box>
							</>
					}
				</Box>
			</DialogContent>
			<DialogActions>
				{executingAccount.type === "ledger" ?
					stage === "confirming" &&
					<PromptLedgerAction text="Confirm transaction on Ledger..." />
					:
					<>
						<Button
							id="cancel-tx"
							onClick={currentReq?.cancel}
							disabled={stage !== "confirming"}>Cancel</Button>
						<Button
							id="confirm-tx"
							onClick={currentReq?.confirm}
							disabled={stage !== "confirming"}>Confirm</Button>
					</>
				}
			</DialogActions>
		</Dialog>
	)
}
export default RunTXs