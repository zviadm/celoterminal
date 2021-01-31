import * as React from 'react'
import { ContractKit, newKit } from '@celo/contractkit'
import { CeloTxReceipt } from '@celo/connect'
import BigNumber from 'bignumber.js'

import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import DialogActions from '@material-ui/core/DialogActions'
import UnlockAccount from './unlock-account'
import Box from '@material-ui/core/Box'
import LinearProgress from '@material-ui/core/LinearProgress'
import List from '@material-ui/core/List'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import SendIcon from '@material-ui/icons/Send'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableBody from '@material-ui/core/TableBody'
import Table from '@material-ui/core/Table'
import TableContainer from '@material-ui/core/TableContainer'
import PromptLedgerAction from './prompt-ledger-action'
import Paper from '@material-ui/core/Paper'
import IconButton from '@material-ui/core/IconButton'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

import { Account } from '../../state/accounts'
import { CFG } from '../../../common/cfg'
import useSessionState from '../../state/session-state'
import { decryptLocalKey } from '../accountsdb'
import { canDecryptLocalKey, createWallet } from './wallet'
import { Transaction, TXFinishFunc, TXFunc } from '../../components/app-definition'
import { fmtAddress, sleep } from '../../../common/utils'
import { transformError } from '../ledger-utils'
import { cfgNetworkURL } from '../kit'

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
		fontFamily: "monospace",
	},
}))

const RunTXs = (props: {
	selectedAccount: Account,
	password?: string,
	txFunc: TXFunc,
	onFinish: TXFinishFunc,
}) => {
	const classes = useStyles()
	const [preparedTXs, setPreparedTXs] = React.useState<ParsedTransaction[]>([])
	const [currentTX, setCurrentTX] = React.useState<{
		idx: number,
		confirm: () => void,
		cancel: () => void,
	} | undefined>()
	const [stage, setStage] = React.useState<
		"preparing"  |
		"confirming" |
		"sending"    |
		"finishing">("preparing")
	const [txSendMS, setTXSendMS] = React.useState(0)

	const txFunc = props.txFunc
	const onFinish = props.onFinish
	const selectedAccount = props.selectedAccount
	const password = props.password
	React.useEffect(() => {
		const startMS = Date.now();
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
				const cfg = CFG()
				const kit = newKit(cfgNetworkURL(), w.wallet)
				kit.defaultAccount = selectedAccount.address
				try {
					const networkId = (await kit.web3.eth.net.getId()).toString()
					if (networkId !== cfg.networkId) {
						throw new Error(
							`Unexpected NetworkId. Expected: ${cfg.networkId}, Got: ${networkId}. ` +
							`Refusing to run transactions.`)
					}
					const txs = await txFunc(kit)
					const parsedTXs: ParsedTransaction[] = []
					for (const tx of txs) {
						const parsedTX = await parseTransaction(kit, tx)
						parsedTXs.push(parsedTX)
					}
					setPreparedTXs(parsedTXs)
					await sleep(Date.now() - startMS + 500)

					const r: CeloTxReceipt[] = []
					for (let idx = 0; idx < txs.length; idx += 1) {
						const txPromise = new Promise<void>((resolve, reject) => {
							setCurrentTX({
								idx: idx,
								confirm: () => {
									setStage("sending")
									resolve()
								},
								cancel: () => {
									setStage("sending")
									reject(new Error(`Cancelled`))
								}
							})
						})
						const tx = txs[idx]
						console.info(`TX:`, parsedTXs[idx], tx.tx.txo.arguments)

						setTXSendMS(0)
						setTXProgress(0)
						setStage("confirming")
						if (selectedAccount.type === "local") {
							// No need to show confirmation dialog for Ledger accounts.
							await txPromise
						}
						const result = await tx.tx.send({
							value: tx.value,
							// perf improvement, avoid re-estimating gas again.
							gas: parsedTXs[idx].estimatedGas.toNumber(),
						})
						const txHash = await result.getHash()
						setStage("sending")
						setTXSendMS(Date.now())
						console.info(`TX-HASH:`, txHash)

						const receipt = await result.waitReceipt()
						setTXProgress(100)
						console.info(`TX-RECEIPT:`, receipt)
						r.push(receipt)
					}
					setStage("finishing")
					await sleep(1000)
					onFinish(undefined, r)
				} finally {
					kit.stop()
					if (w.transport) {
						await w.transport.close()
					}
				}
			} catch (e) {
				onFinish(transformError(e))
			}
		})()
	// NOTE: This effect is expected to run only once on first render and it is expected
	// that parent will unmount the component once it calls onFinish.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	const [txProgress, setTXProgress] = React.useState(0)
	React.useEffect(() => {
		if (stage !== "sending") {
			return
		}
    const timer = setInterval(() => {
			const progress = (
				txSendMS === 0 ? 0 : Math.min(99, (Date.now() - txSendMS) / 5000 * 100.0))
      setTXProgress((txProgress) => Math.max(progress, txProgress))
    }, 200)
    return () => { clearInterval(timer) }
  }, [stage, txSendMS]);
	return (
		<Dialog open={true}>
			<DialogContent className={classes.root}>
				<Box display="flex" flexDirection="column">
					{
					stage === "preparing" || !currentTX ?
					<>
						<Typography className={classes.progressText}>Preparing transactions...</Typography>
						<LinearProgress color="primary" />
					</>
					:
					<>
						<Paper>
							<List dense={true}>
								{preparedTXs.map((tx, idx) => (
									<ListItem key={`${idx}`}>
										<ListItemIcon>
											{
											(idx < currentTX.idx || stage === "finishing") ?
											<CheckCircleIcon /> :
											(idx === currentTX.idx) ? <SendIcon /> : <></>
											}
										</ListItemIcon>
										<ListItemText primaryTypographyProps={{className: classes.address}}>
											Contract: {preparedTXs[idx].contractName}
										</ListItemText>
									</ListItem>
								))}
							</List>
						</Paper>
						<Box marginTop={1}>
							<TransactionInfo tx={preparedTXs[currentTX.idx]}/>
						</Box>
						<Box marginTop={1}>
							<LinearProgress
								style={{visibility: stage === "confirming" ? "hidden" : undefined}}
								color="primary"
								variant="determinate"
								value={txProgress}
								/>
						</Box>
					</>
					}
				</Box>
			</DialogContent>
			<DialogActions>
				{props.selectedAccount.type === "ledger" ?
				stage === "confirming" &&
				<PromptLedgerAction text="Confirm transaction on Ledger..." />
				:
				<>
					<Button onClick={currentTX?.cancel} disabled={stage !== "confirming"}>Cancel</Button>
					<Button onClick={currentTX?.confirm} disabled={stage !== "confirming"}>Confirm</Button>
				</>
				}
			</DialogActions>
		</Dialog>
	)
}

interface ParsedTransaction {
	estimatedGas: BigNumber, // Gas price in WEI
	encodedABI: string,

	// Human readable values.
	contractName: string,
	estimatedFee: BigNumber,
	feeCurrency: string,
	transferValue?: BigNumber, // Amount of directly transfering CELO.
}

const parseTransaction = async (
	kit: ContractKit,
	tx: Transaction): Promise<ParsedTransaction> => {
	const contractAddress = tx.tx.txo._parent.options.address
	const addressMapping = await kit.registry.addressMapping()
	const match = Array.from(
		addressMapping.entries()).find((i) => i[1].toLowerCase() === contractAddress.toLowerCase())
	const contractName = match ? `${match[0]} (${fmtAddress(contractAddress)})` : contractAddress
	const estimatedGas =
		tx.tx.defaultParams?.gas ?
		new BigNumber(tx.tx.defaultParams?.gas) :
		new BigNumber(await tx.tx.txo.estimateGas()).multipliedBy(kit.gasInflationFactor).integerValue()
	// TODO(zviad): Add support for other fee currencies.
	const gasPrice = await kit.connection.gasPrice()
	const estimatedFee = estimatedGas.multipliedBy(gasPrice).div(1e18)
	return {
		estimatedGas,
		encodedABI: tx.tx.txo.encodeABI(),

		contractName,
		estimatedFee,
		feeCurrency: "CELO",
		transferValue: tx.value ? new BigNumber(tx.value.toString()).div(1e18) : undefined,
	}
}

const TransactionInfo = (props: {
	tx: ParsedTransaction
}) => {
	const [open, setOpen] = React.useState(false)
	return (
		<TableContainer component={Paper}>
			<Table size="small">
				<TableBody>
					<TableRow>
						<TableCell width="20%">Contract</TableCell>
						<TableCell>{props.tx.contractName}</TableCell>
						<TableCell width="1%">
							<IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
								{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
							</IconButton>
						</TableCell>
					</TableRow>
					{open &&
					<TableRow>
						<TableCell></TableCell>
						<TableCell
							colSpan={2}
							style={{
								fontFamily: "monospace",
								textTransform: "uppercase",
								overflowWrap: "anywhere"}}>calldata: {props.tx.encodedABI}</TableCell>
					</TableRow>}
					{props.tx.transferValue &&
					<TableRow>
						<TableCell>Transfer</TableCell>
						<TableCell colSpan={2}>{props.tx.transferValue.toFixed(4)} CELO</TableCell>
					</TableRow>}
					<TableRow>
						<TableCell>Fee</TableCell>
						<TableCell colSpan={2}>~{props.tx.estimatedFee.toFixed(4, BigNumber.ROUND_UP)} {props.tx.feeCurrency}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</TableContainer>
	)
}