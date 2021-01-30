import * as React from 'react'
import { newKit } from '@celo/contractkit'
import { CeloTxReceipt } from '@celo/connect'

import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import DialogActions from '@material-ui/core/DialogActions'
import UnlockAccount from './unlock-account'
import Box from '@material-ui/core/Box'
import { LinearProgress } from '@material-ui/core'

import { Account } from '../../state/accounts'
import { CFG } from '../../../common/cfg'
import useSessionState from '../../state/session-state'
import { decryptLocalKey } from '../accountsdb'
import { canDecryptLocalKey, createWallet } from './wallet'
import { Transaction, TXFinishFunc, TXFunc } from '../../components/app-definition'
import { sleep } from '../../../common/utils'

function TXRunner(props: {
	selectedAccount: Account,
	txFunc?: TXFunc,
	onFinish: TXFinishFunc,
	onError: (e: Error) => void,
}): JSX.Element {
	const [pw, setPW] = useSessionState<{
		password: string,
		expireMS: number,
	} | undefined>("terminal/core/password", undefined)
	let pwValid = false
	if (props.selectedAccount.type === "local") {
		// check password.
		pwValid = (pw ?
			pw && pw.expireMS > Date.now() &&
			canDecryptLocalKey(props.selectedAccount, pw.password) : false)
		if (!pwValid && pw) {
			setPW(undefined)
		}
	}
	const pwNeeded = props.selectedAccount.type === "local" && !pwValid
	const pwOnCancel = () => {
		props.onFinish(new Error(`Cancelled`), [])
	}
	const pwOnPassword = (p: string) => {
		if (props.selectedAccount.type !== "local") {
			return
		}
		try {
			decryptLocalKey(props.selectedAccount, p)
			setPW({password: p, expireMS: Date.now() + 60 * 60 * 1000})
		} catch (e) {
			props.onError(e)
		}
	}
	return (<>{props.txFunc && (
		pwNeeded ?
		<UnlockAccount
			onCancel={pwOnCancel}
			onPassword={pwOnPassword}
		/> :
		<RunTXs
			selectedAccount={props.selectedAccount}
			password={pw?.password}
			txFunc={props.txFunc}
			onFinish={props.onFinish}
		/>
	)}</>)
}
export default TXRunner

const useStyles = makeStyles(() => ({
	progressText: {
		fontStyle: "italic",
	},
	address: {
		fontFamily: "monospace",
	},
	box: {
		display: "flex",
		flexDirection: "column",
	},
}))

const RunTXs = (props: {
	selectedAccount: Account,
	password?: string,
	txFunc: TXFunc,
	onFinish: TXFinishFunc,
}) => {
	const classes = useStyles()
	const [currentTX, setCurrentTX] = React.useState<{
		tx: Transaction,
		confirm: () => void,
		cancel: () => void,
	} | undefined>()
	const [stage, setStage] = React.useState<
		"preparing" |
		"executing" |
		"finishing">("preparing")
	const [txSendMS, setTXSendMS] = React.useState(0)

	const txFunc = props.txFunc
	const onFinish = props.onFinish
	const selectedAccount = props.selectedAccount
	const password = props.password
	React.useEffect(() => {
		(async () => {
			try {
				const w = await createWallet(selectedAccount, password)
				const accounts = w.wallet.getAccounts()
				if (accounts.length !== 1 ||
					accounts[0].toLowerCase() !== selectedAccount.address.toLowerCase()) {
					throw new Error(
						`Unexpected Account. Expected: ${selectedAccount.address}, Got: ${accounts[0]}. ` +
						`Refusing to run transactions.`)
				}
				const kit = newKit(CFG.networkURL, w.wallet)
				kit.defaultAccount = selectedAccount.address
				try {
					const networkId = await kit.web3.eth.net.getId()
					if (networkId !== CFG.networkId) {
						throw new Error(
							`Unexpected NetworkId. Expected: ${CFG.networkId}, Got: ${networkId}. ` +
							`Refusing to run transactions.`)
					}
					const txs = await txFunc(kit)
					const r: CeloTxReceipt[] = []
					for (const tx of txs) {
						const txPromise = new Promise<void>((resolve, reject) => {
							setCurrentTX({
								tx: tx,
								confirm: () => {
									setCurrentTX(undefined)
									resolve()
								},
								cancel: () => {
									setCurrentTX(undefined)
									reject(new Error(`Cancelled`))
								}
							})
						})
						console.info(`TX: args`, tx.tx.txo._parent.options.address, tx.tx.txo.arguments)

						setTXSendMS(0)
						setTXProgress(0)
						setStage("executing")
						if (selectedAccount.type === "local") {
							// No need to show confirmation dialog for Ledger accounts.
							await txPromise
						}
						const result = await tx.tx.send({value: tx.value})
						const txHash = await result.getHash()
						setCurrentTX(undefined)
						setTXSendMS(Date.now())
						console.info(`TX: sent`, txHash)

						const receipt = await result.waitReceipt()
						setTXProgress(100)
						console.info(`TX: receipt`, receipt)
						r.push(receipt)
					}
					setStage("finishing")
					await sleep(500)
					onFinish(undefined, r)
				} finally {
					kit.stop()
					if (w.transport) {
						await w.transport.close()
					}
				}
			} catch (e) {
				onFinish(e)
			}
		})()
	// NOTE: This effect is expected to run only once on first render and it is expected
	// that parent will unmount the component once it calls onFinish.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	const [txProgress, setTXProgress] = React.useState(0)
	React.useEffect(() => {
		if (stage !== "executing") {
			return
		}
    const timer = setInterval(() => {
			const progress = (
				txSendMS === 0 ? 0 : Math.min(99, (Date.now() - txSendMS) / 5000 * 100.0))
      setTXProgress((txProgress) => Math.max(progress, txProgress))
    }, 200)
    return () => {
      clearInterval(timer);
    };
  }, [stage, txSendMS]);
	return (
		<Dialog open={true}>
			<DialogContent>
				{
				stage === "preparing" ?
				<Box className={classes.box}>
					<Typography className={classes.progressText}>Preparing transactions...</Typography>
					<LinearProgress color="primary" />
				</Box>
				:
				currentTX ?
				<div>
					<Typography>TXInfo: Contract: {`${currentTX.tx.tx.txo._parent.options.address}`}</Typography>

					{props.selectedAccount.type === "local" ?
					<Typography>Confirm transaction to proceed</Typography>
					:
					<Typography>Confirm transaction on Ledger device</Typography>
					}
				</div>
				:
				<Box className={classes.box}>
					<Typography className={classes.progressText}>Sending transaction...</Typography>
					<LinearProgress color="primary" variant="determinate" value={txProgress} />
				</Box>
				}
			</DialogContent>
			{props.selectedAccount.type === "local" &&
			<DialogActions>
				<Button onClick={currentTX?.cancel} disabled={!currentTX}>Cancel</Button>
				<Button onClick={currentTX?.confirm} disabled={!currentTX}>Confirm</Button>
			</DialogActions>}
		</Dialog>
	)
}
