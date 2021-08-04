/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CeloContract, ContractKit, StableToken } from '@celo/contractkit'
import { isValidAddress } from 'ethereumjs-util'
import { BigNumber } from 'bignumber.js'

import { Account } from '../../../lib/accounts/accounts'
import useOnChainState from '../../state/onchain-state'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { clipboard } from 'electron'

import * as React from 'react'
import Box from '@material-ui/core/Box'
import Paper from '@material-ui/core/Paper'
import Alert from '@material-ui/lab/Alert'
import Erc20Contract from '../../../lib/erc20/erc20-contract'

import AppHeader from '../../components/app-header'
import { MultiSend } from './def'
import { UiFile } from './components/file'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableContainer from '@material-ui/core/TableContainer'
import Button from '@material-ui/core/Button'
import TableHead from '@material-ui/core/TableHead'
import useLocalStorageState from '../../state/localstorage-state'
import { parseBalanceMap } from './utils/parse-balance-map'
import MerkleDistributorAbi from './MerkleDistributor.json'
import {
	AbiItem,
	CeloTxReceipt,
	toTransactionObject,
} from '@celo/connect'
import kit from '../../state/kit'
import { makeStyles, TextField, Tooltip } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import SendIcon from '@material-ui/icons/Send'
import DescriptionIcon from '@material-ui/icons/Description'
import SearchIcon from '@material-ui/icons/Search'
import UndoIcon from '@material-ui/icons/Undo'
import IconButton from '@material-ui/core/IconButton'
import FileCopy from '@material-ui/icons/FileCopy'

import { Disbursement, Merkle, Transfer } from './disbursementsdb'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { useDisbursements } from './disbursements-state'
import { v4 as uuid } from 'uuid'
import { useErc20List } from '../../state/erc20list-state'

const useStyles = makeStyles((theme) => ({
	button: {
		margin: theme.spacing(1),
		fontFamily: "Inter",
		color: "#065DA7",
		fontStyle: "normal",
		fontWeight: "normal",
		fontSize: "16px",
		lineHeight: "20px",
		border: "1px solid #065DA7",
		boxSizing: "border-box",
	},
	h1: {
		fontFamily: "Helvetica",
		color: "#065DA7",
		fontStyle: "normal",
		fontWeight: "normal",
		fontSize: "40px",
		lineHeight: "46px",
	},
	h2: {
		fontFamily: "Inter",
		color: "#065DA7",
		fontStyle: "normal",
		fontWeight: "bold",
		fontSize: "36px",
		lineHeight: "44px",
	},
	h3: {
		fontFamily: "Inter",
		color: "#065DA7",
		fontStyle: "normal",
		fontWeight: "normal",
		fontSize: "14px",
		lineHeight: "20px",
	},
	regular: {
		fontFamily: "Inter",
		fontStyle: "normal",
		fontWeight: "normal",
		fontSize: "16px",
		lineHeight: "20px",
		/* or 125% */
		fontFeatureSettings: "'calt' off",
		color: "#065DA7",
	},
	large: {
		fontFamily: "Inter",
		color: "#065DA7",
		fontStyle: "normal",
		fontWeight: "normal",
		fontSize: "32px",
		lineHeight: "40px",
		fontFeatureSettings: "'calt' off",
	},
	tableCell: {
		color: "#065DA7",
		fontStyle: "normal",
		fontWeight: "bold",
		fontSize: "14px",
		lineHeight: "20px",
	},
	tableRow: {
		color: "#065DA7",
		fontStyle: "normal",
		fontWeight: "normal",
		fontSize: "16px",
		fontFeatureSettings: "'calt' off",
		lineHeight: "20px",
		boxShadow: "inset 0px -1px 0px #065DA7",
		background: "#FFFFFF",
	},
	boxRight: {
		border: "1px solid #065DA7",
	},
	formControl: {
		margin: theme.spacing(1),
		minWidth: 120,
	},
	selectEmpty: {
		marginTop: theme.spacing(2),
	},
	input: {
		border: "1px solid#065DA7",
		color: "#065DA7",
		"&$hover": {
			border: "1px solid #065DA7",
		},
		backgroundColor: "#FFFFFF",
	},
}))

const MultiSendApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const classes = useStyles()
	const k = kit()
	const erc20List = useErc20List()
	const [erc20, setErc20] = useLocalStorageState(
		"terminal/send-receive/erc20",
		erc20List.erc20s[0].name
	)
	const selectedAddress = props.selectedAccount.address

	const {
		disbursements,
		transfers,
		setTransfers,
		selectedDisbursement,
		addDisbursement,
		updateDisbursement,
		addTransferDB,
		updateTransfer,
		removeTransfer,
		setSelectedDisbursement,
		selectedDisbursementTransfers,
	} = useDisbursements()

	const [transfersInvalid, setTransfersInvalid] = React.useState(
		[] as Transfer[]
	)

	const [merkleTree, setMerkleTree] = React.useState({} as Merkle)
	const [merkleValid, setMerkleValid] = React.useState<boolean | undefined>(
		undefined
	) // Should be part of the disbursement

	// Contract address from the verification step.
	const [contractAddress, setContractAddress] = React.useState("")

	// Managing pages
	const [started, setStarted] = React.useState(false) //When true we are in the verification or new disbursement page.
	const [newDisbursement, setNewDisbursement] = React.useState(false) //True when we are in the new disbursement page. False when we are in the verify page.

	// State of the new transfer addiction in the list
	const [to, setTo] = React.useState("")
	const [amount, setAmount] = React.useState("")
	const [reason, setReason] = React.useState("")

	//Show dialogo to confirm
	const [show, setShow] = React.useState(false)

	// Balance of the contract.
	const [balance, setBalance] = React.useState<string | undefined>(undefined)

	// Page disbursements
	const [disbursementsPage, setDisbusementsPage] = React.useState<number>(1)

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const loadBalance = async (
		contractKit: ContractKit,
		address: string
	): Promise<string> => {
		const token = await getToken(erc20, contractKit)
		const balance = await token.balanceOf(address)
		return balance.shiftedBy(-18).toString()
	}

	const updateBalance = React.useCallback(async () => {
		if (k && selectedDisbursement?.contract) {
			setBalance(await loadBalance(k, selectedDisbursement?.contract))
		}
	}, [k, selectedDisbursement, loadBalance])

	React.useEffect(() => {
		updateBalance()
	}, [updateBalance])

	const handleClose = () => setShow(false)
	const handleShow = () => setShow(true)
	const { isFetching, fetched, refetch } = useOnChainState(
		React.useCallback(
			async (kit: ContractKit) => {
				const contract = await newERC20(kit, erc20)
				const decimals = contract.decimals()
				const balance = contract.balanceOf(selectedAddress)

				return {
					decimals: await decimals,
					balance: await balance,
				}
			},
			[selectedAddress, erc20]
		)
	)

	const parseOptions = {
		header: false,
		dynamicTyping: false,
		skipEmptyLines: true,
	}

	const onClearArray = () => {
		setTransfers([])
		setContractAddress("") // Maybe needs to be moved out of here.
		setMerkleTree({} as Merkle)
		setMerkleValid(undefined)
		setTransfersInvalid([])
	}

	const onClickNewDisbursement = (currency: string) => {
		setErc20(currency)
		setNewDisbursement(true)
		setStarted(true)
		const id: string = uuid()
		const disbursementInitial = {
			id: id,
			contract: "",
			date: Date.now(),
			amount: "0",
			status: "DRAFT",
			currency: currency,
		} as Disbursement
		setSelectedDisbursement(disbursementInitial)
		addDisbursement(disbursementInitial)
	}

	const onClickDisbursement = (d: Disbursement) => {
		setErc20(d.currency)
		setSelectedDisbursement(d)
		selectedDisbursementTransfers(d)
		setNewDisbursement(true)
		setStarted(true)
	}

	const onClickVerify = () => {
		setTransfers([])
		setTransfersInvalid([])
		setMerkleTree({} as Merkle)
		setMerkleValid(undefined)
		setNewDisbursement(false)
		setStarted(true)
	}

	const backToStart = () => {
		setTransfers([])
		setMerkleTree({} as Merkle)
		setNewDisbursement(false)
		setStarted(false)
	}

	const addTransfer = () => {
		const id: string = uuid()
		const transfer = {
			id: id,
			disbursement_id: selectedDisbursement?.id,
			address: to,
			earnings: k.web3.utils.toWei(amount),
			reasons: reason || "",
			status: "INITIAL",
		} as Transfer
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const add = [...transfers!].concat(transfer)
		setTransfers(add)
		if (newDisbursement) {
			addTransferDB(transfer)
		}
	}

	const deleteTransfer = (t: Transfer) => {
		if (newDisbursement) {
			removeTransfer(t)
		}
		const deletedTransfer = transfers?.filter((x) => x.id !== t.id)
		setTransfers(deletedTransfer)
	}

	const canAddTransfer = isValidAddress(to) && amount !== ""

	const handleFile = async (data: string[][]) => {
		setTransfersInvalid([])
		const arrayToJson: Transfer[] = data.map((value: string[]) => {
			const id: string = uuid()
			return {
				id: id,
				disbursement_id: selectedDisbursement?.id,
				address: value[0],
				earnings: k.web3.utils.toWei(value[1]),
				reasons: value[2] || "",
				status: "INITIAL",
			} as Transfer
		})
		const valid = arrayToJson.filter((x: Transfer) =>
			isValidAddress(x.address)
		)
		const invalid = arrayToJson.filter(
			(x: Transfer) => !isValidAddress(x.address)
		)
		if (invalid.length > 0) {
			setTransfersInvalid(invalid)
			return
		}
		const mTree = JSON.parse(JSON.stringify(parseBalanceMap(valid)))
		setMerkleTree(mTree)
		if (newDisbursement) {
			valid.map(addTransferDB)
		}
		setTransfers(valid)
	}

	const verify = async () => {
		try {
			const abi = MerkleDistributorAbi.abi
			const merkleDistributor = new k.web3.eth.Contract(
				abi as AbiItem[],
				contractAddress
			)
			const distributorMerkleRoot = await merkleDistributor.methods
				.merkleRoot()
				.call()
			const valid = merkleTree.merkleRoot === distributorMerkleRoot
			setMerkleValid(valid)
		} catch {
			setMerkleValid(false)
		}
	}

	React.useEffect(() => {
		if (transfers === undefined) {
			return
		}
		if (
			transfers?.length > 0 &&
			transfers?.length ===
				transfers?.filter(
					(t) =>
						t.status === "COMPLETED" &&
						transfers?.filter((t) => t.status === "READY").length === 0 &&
						transfers?.filter((t) => t.status === "READY_TO_DISTRIBUTE")
							.length === 0
				).length
		) {
			updateDisbursement({
				id: selectedDisbursement?.id,
				contract: selectedDisbursement?.contract,
				date: selectedDisbursement?.date,
				amount: selectedDisbursement?.amount,
				status: "COMPLETED",
			} as Disbursement)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transfers])

	const handleDeployment = () => {
		const mTree = JSON.parse(JSON.stringify(parseBalanceMap(transfers!)))
		const abi = MerkleDistributorAbi.abi

		props.runTXs(
			async (kit: ContractKit): Promise<any> => {
				const celoToken = await getToken(erc20, kit)

				// const abi = MerkleDistributorAbi.abi
				const merkleDistributor = new kit.web3.eth.Contract(abi as AbiItem[])
				const claimTx = await toTransactionObject(
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore - unhappy with the abi format, but it is valid
					kit.connection,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					merkleDistributor.deploy({
						data: "0x" + MerkleDistributorAbi.bytecode,
						arguments: [celoToken.address, mTree.merkleRoot],
					})
				)
				return [{ tx: claimTx }]
			},
			(e?: Error, receipts?: CeloTxReceipt[]) => {
				if (e || receipts === undefined) {
					refetch()
					return
				}
				const contract = new k.web3.eth.Contract(
					abi as AbiItem[],
					receipts[0].contractAddress
				)
				mTree.contractAddress = contract.options.address
				setMerkleTree(mTree)
				updateDisbursement({
					id: selectedDisbursement?.id,
					contract: contract.options.address,
					date: selectedDisbursement?.date,
					amount: mTree.tokenTotal,
					status: "SUBMITTED",
				} as Disbursement)
				transfers?.map((t) =>
					updateTransfer({
						id: t.id,
						disbursement_id: t.disbursement_id,
						address: t.address,
						earnings: t.earnings,
						reasons: t.reasons || "",
						status: "READY",
					} as Transfer)
				)
				refetch()
			}
		)
	}

	const handleDistributeIndividual = (transfer: Transfer) => {
		props.runTXs(
			async (kit: ContractKit): Promise<any> => {
				const abi = MerkleDistributorAbi.abi
				const distAddress = selectedDisbursement!.contract
				const mTree = JSON.parse(JSON.stringify(parseBalanceMap(transfers!)))
				setMerkleTree(mTree)

				const merkleDistributor = new kit.web3.eth.Contract(
					abi as AbiItem[],
					distAddress
				)
				const distributorMerkleRoot = await merkleDistributor.methods
					.merkleRoot()
					.call()
				if (mTree.merkleRoot != distributorMerkleRoot) {
					console.log(
						`merkle root: ${mTree.merkleRoot} does not match contract root: ${distributorMerkleRoot}`
					)
				}
				const account = transfer.address
				const claim = mTree.claims[k.web3.utils.toChecksumAddress(account)]
				const isClaimed = await merkleDistributor.methods
					.isClaimed(claim.index)
					.call()
				if (isClaimed) {
					console.log("Disbursement already done")
					return { account, success: false, status: "already_claimed" }
				}
				const claimTx = toTransactionObject(
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore - unhappy with the abi format, but it is valid
					kit.connection,
					merkleDistributor.methods.claim(
						claim.index,
						account,
						claim.amount,
						claim.proof
					)
				)

				updateTransfer({
					id: transfer.id,
					disbursement_id: transfer.disbursement_id,
					address: transfer.address,
					earnings: transfer.earnings,
					reasons: transfer.reasons || "",
					status: "COMPLETED",
				} as Transfer)
				return [{ tx: claimTx }]
			},
			(e?: Error) => {
				if (e) {
					updateTransfer({
						id: transfer.id,
						disbursement_id: transfer.disbursement_id,
						address: transfer.address,
						earnings: transfer.earnings,
						reasons: transfer.reasons || "",
						status: "READY_TO_DISTRIBUTE",
					} as Transfer)
				}
				refetch()
			}
		)
	}

	const onClickDistribute = () => {
		transfers?.map((transfer) =>
			updateTransfer({
				id: transfer.id,
				disbursement_id: transfer.disbursement_id,
				address: transfer.address,
				earnings: transfer.earnings,
				reasons: transfer.reasons || "",
				status: "READY_TO_DISTRIBUTE",
			} as Transfer)
		)
		updateDisbursement({
			id: selectedDisbursement?.id,
			contract: selectedDisbursement?.contract,
			date: selectedDisbursement?.date,
			amount: selectedDisbursement?.amount,
			status: "IN PROGRESS",
		} as Disbursement)
	}

	const totalToDisburse = k.web3.utils.fromWei(
		new BigNumber(
			transfers
				?.map((x: Transfer) =>new BigNumber(x.earnings))
				?.reduce(
					(a: BigNumber, b: BigNumber): BigNumber => a.plus(b),
					new BigNumber(0)
				) || new BigNumber(0)
		).toString()
	)
	const canSend =
		transfersInvalid === undefined || transfersInvalid.length == 0
	const isDeployed = selectedDisbursement?.status != "DRAFT"
	const isSubmitted = selectedDisbursement?.status === "SUBMITTED"
	const isInProgress = selectedDisbursement?.status === "IN PROGRESS"
	const isCompleted = selectedDisbursement?.status === "COMPLETED"

	const canDistribute = isSubmitted && balance! >= totalToDisburse!
	const canDistributeIndividual = (tranfer: Transfer) =>
		tranfer.status === "READY_TO_DISTRIBUTE" // && (selectedDisbursement?.status != 'COMPLETED')
	const isDistributedIndividual = (tranfer: Transfer) =>
		tranfer.status === "COMPLETED"

	const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
		setErc20(event.target.value as string)
	}

	const capitalize = (s: string) => {
		if (typeof s !== "string") return ""
		return s.charAt(0).toUpperCase() + s.slice(1)
	}

	// Components
	const CopyAddressButton = (props: { address?: string }) => {
		const [copied, setCopied] = React.useState(false)
		const handleCopyAddress = () => {
			if (!props.address) {
				return
			}
			clipboard.writeText(props.address)
			setCopied(true)
		}
		const resetCopied = () => {
			if (copied) {
				setCopied(false)
			}
		}
		return (
			<Tooltip title={copied ? "Copied" : "Copy Address"} onClose={resetCopied}>
				<IconButton
					size="small"
					onClick={handleCopyAddress}
					disabled={!props.address}
				>
					<FileCopy />
				</IconButton>
			</Tooltip>
		)
	}
	const disbursementsTable = (
		<Box m={2} p={6}>
			<TableContainer>
				<Table size="medium">
					<TableHead>
						<TableRow>
							<TableCell className={classes.tableCell}>Id</TableCell>
							<TableCell className={classes.tableCell}>Contract</TableCell>
							<TableCell className={classes.tableCell}>Date</TableCell>
							<TableCell className={classes.tableCell}>Status</TableCell>
							<TableCell className={classes.tableCell}>Amount</TableCell>
							<TableCell className={classes.tableCell}>Currency</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{disbursements
							.slice(
								0 + 10 * (disbursementsPage - 1),
								10 + 10 * (disbursementsPage - 1)
							)
							?.map((d: Disbursement, index) => {
								return (
									<TableRow
										className={classes.tableRow}
										key={d.id}
										onClick={() => {
											onClickDisbursement(d)
										}}
									>
										<TableCell className={classes.tableRow}>
											{(disbursementsPage - 1) * 10 + index + 1}
										</TableCell>
										<TableCell className={classes.tableRow}>
											{d.contract}
										</TableCell>
										<TableCell className={classes.tableRow}>
											{new Date(d.date).toLocaleString()}
										</TableCell>
										<TableCell className={classes.tableRow}>
											{capitalize(d.status.toLowerCase())}
										</TableCell>
										<TableCell className={classes.tableRow}>
											{k.web3.utils.fromWei(new BigNumber(d.amount).toString())}
										</TableCell>
										<TableCell className={classes.tableRow}>
											{d.currency}
										</TableCell>
									</TableRow>
								)
							})}
					</TableBody>
				</Table>
			</TableContainer>
			{disbursements.length > 10 ? (
				<Box display="flex" flexDirection="column" alignItems="center">
					<Box display="flex" flexDirection="row" alignItems="center">
						<Button
							id="previous-page"
							className={classes.button}
							variant="outlined"
							color="primary"
							disabled={disbursementsPage === 1}
							onClick={() => {
								setDisbusementsPage(disbursementsPage - 1)
							}}
						>
							{"<"}
						</Button>
						<h3 className={classes.h3}>{disbursementsPage}</h3>
						<Button
							id="next-page"
							className={classes.button}
							disabled={disbursementsPage > disbursements.length / 10}
							variant="outlined"
							color="primary"
							onClick={() => {
								setDisbusementsPage(disbursementsPage + 1)
							}}
						>
							{">"}
						</Button>
					</Box>
				</Box>
			) : (
				<></>
			)}
		</Box>
	)
	const initialPage = (
		<Box marginTop={2}>
			<Paper>
				<Box display="flex" flexDirection="row" alignItems="center" p={8}>
					<h1 className={classes.h1}>Disbursements</h1>
					<Box display="flex" flexDirection="row" ml="auto">
						<FormControl className={classes.formControl}>
							<Select
								id="demo-customized-select-native"
								color="primary"
								value={erc20}
								className={classes.input}
								onChange={handleChange}
							>
								<MenuItem
									value={"CELO"}
									onClick={() => onClickNewDisbursement("CELO")}
								>
									New Disbursement CELO
								</MenuItem>
								<MenuItem
									value={"cUSD"}
									onClick={() => onClickNewDisbursement("cUSD")}
								>
									New Disbursement cUSD
								</MenuItem>
								<MenuItem
									value={"cEUR"}
									onClick={() => onClickNewDisbursement("cEUR")}
								>
									New Disbursement cEUR
								</MenuItem>
							</Select>
						</FormControl>
						<Button
							id="verify-disbursement"
							className={classes.button}
							variant="outlined"
							color="primary"
							onClick={onClickVerify}
							startIcon={<DescriptionIcon />}
						>
							Verify Disbursement
						</Button>
					</Box>
				</Box>
				{disbursementsTable}
			</Paper>
		</Box>
	)
	const transactionsListTable = (
		<Box mr={6}>
			<TableContainer>
				<Box display="flex" flexDirection="row">
					<Box display="flex" mr="auto" m={2}>
						<h2 className={classes.h2}>Transactions</h2>
					</Box>
					<Box display="flex" ml="auto" m={4}>
						{(!isDeployed && newDisbursement) || !newDisbursement ? (
							<UiFile
								className={classes.button}
								onFileLoaded={handleFile}
								parseOptions={parseOptions}
							/>
						) : (
							<></>
						)}
					</Box>
				</Box>
				<Table size="medium">
					<TableHead>
						<TableRow>
							<TableCell className={classes.tableCell}>Index</TableCell>
							<TableCell className={classes.tableCell}>Address</TableCell>
							<TableCell className={classes.tableCell}>Amount</TableCell>
							<TableCell className={classes.tableCell}>Recipient</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{!isDeployed || !newDisbursement ? (
							<TableRow key="add row">
								<TableCell>---</TableCell>
								<TableCell>
									<TextField
										id="amount-input"
										label={`Address`}
										value={to}
										size="small"
										inputMode="decimal"
										fullWidth={true}
										onChange={(e) => {
											setTo(e.target.value)
										}}
									/>
								</TableCell>
								<TableCell>
									<TextField
										id="amount-input"
										label={`Amount`}
										value={amount}
										size="small"
										inputMode="decimal"
										fullWidth={true}
										onChange={(e) => {
											setAmount(e.target.value)
										}}
									/>
								</TableCell>
								<TableCell>
									<TextField
										id="reason-input"
										label={`Recipient`}
										value={reason}
										size="small"
										inputMode="decimal"
										fullWidth={true}
										onChange={(e) => {
											setReason(e.target.value)
										}}
									/>
								</TableCell>
								<TableCell>
									<Button
										id="send"
										variant="outlined"
										color="primary"
										disabled={!canAddTransfer}
										onClick={addTransfer}
									>
										Add
									</Button>
								</TableCell>
							</TableRow>
						) : (
							<></>
						)}
						{transfers?.map((t: Transfer, index) => {
							return (
								<TableRow className={classes.tableRow} key={index}>
									<TableCell className={classes.tableRow}>
										{index + 1}
									</TableCell>
									<TableCell className={classes.tableRow}>
										{t.address}
									</TableCell>
									<TableCell className={classes.tableRow}>
										{k.web3.utils.fromWei(new BigNumber(t.earnings).toString())}{" "}
										{erc20}
									</TableCell>
									<TableCell className={classes.tableRow}>
										{t.reasons}
									</TableCell>
									{isDeployed && !isDistributedIndividual(t) ? (
										<TableCell>
											<Button
												id="claim-funds"
												variant="outlined"
												color="primary"
												className={classes.button}
												disabled={!canDistributeIndividual(t)}
												onClick={() => {
													handleDistributeIndividual(t)
												}}
												endIcon={<SendIcon />}
											>
												Send
											</Button>
										</TableCell>
									) : (
										<></>
									)}
									{!isDeployed ? (
										<TableCell className={classes.tableRow}>
											<IconButton
												color="primary"
												onClick={() => {
													deleteTransfer(t)
												}}
											>
												<DeleteIcon />
											</IconButton>
										</TableCell>
									) : (
										<></>
									)}
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	)
	const verifyContractBox = (
		<Box display="flex" ml="auto" className={classes.boxRight}>
			<Box
				display="flex"
				flexDirection="column"
				alignItems="left"
				p={4}
				minWidth={200}
			>
				<h3 className={classes.h3}>Transactions</h3>
				<div className={classes.large}>{transfers?.length}</div>
				<h3 className={classes.h3}>Total Disbursement</h3>
				<div className={classes.large}>{totalToDisburse}</div>
				<TextField
					id="contract-to-verify"
					label="Merkle contract address"
					margin="dense"
					value={contractAddress}
					onChange={(e) => {
						setContractAddress(e.target.value)
					}}
				/>
				{merkleValid != undefined ? (
					merkleValid ? (
						<h3 className={classes.h3}>Contract verified </h3>
					) : (
						<h3 className={classes.h3} style={{ color: "red" }}>
							Verification failed{" "}
						</h3>
					)
				) : (
					<></>
				)}
				<Button
					id="verify-contract"
					variant="outlined"
					color="primary"
					className={classes.button}
					onClick={verify}
					startIcon={<SearchIcon />}
				>
					Verify contract
				</Button>
				<Button
					id="Clear-disbursement"
					variant="outlined"
					color="primary"
					className={classes.button}
					disabled={!transfers}
					onClick={onClearArray}
					startIcon={<DeleteIcon />}
				>
					Cancel
				</Button>
			</Box>
		</Box>
	)
	const previewDisbursementBox = (
		<Box display="flex" ml="auto" className={classes.boxRight}>
			<Box
				display="flex"
				flexDirection="column"
				alignItems="left"
				p={4}
				minWidth={200}
			>
				{isCompleted || isInProgress ? (
					<h2 className={classes.h2}>Summary</h2>
				) : isSubmitted ? (
					<h2 className={classes.h2}>Review</h2>
				) : (
					<h2 className={classes.h2}>Preview</h2>
				)}
				<h3 className={classes.h3}>Transactions</h3>
				<div className={classes.large}>{transfers?.length}</div>
				<h3 className={classes.h3}>Total Disbursement</h3>
				<div className={classes.large}>
					{totalToDisburse} {erc20}
				</div>
				{isDeployed ? (
					<>
						{isSubmitted ? (
							<h4 className={classes.tableCell}>
								To initiate, provide your custodian with the address below and
								approve the disbursement.
							</h4>
						) : (
							<h4 className={classes.tableCell}>
								Disbursement completed succesfully.
							</h4>
						)}
						<h3 className={classes.h3}>
							{selectedDisbursement?.contract}{" "}
							<CopyAddressButton address={selectedDisbursement?.contract} />
						</h3>
						<h3 className={classes.h3}>Contract funds: </h3>
						<div className={classes.large}>
							{balance} {erc20}
						</div>
						{!isCompleted && !isInProgress ? (
							<Button
								id="claim-funds"
								variant="outlined"
								color="primary"
								className={classes.button}
								disabled={!canDistribute}
								onClick={onClickDistribute}
								endIcon={<SendIcon />}
							>
								Start disbursement
							</Button>
						) : (
							<></>
						)}
					</>
				) : (
					<div>
						<Button
							id="Disburse"
							className={classes.button}
							variant="outlined"
							color="primary"
							disabled={transfers?.length == 0}
							onClick={handleShow}
							startIcon={<DescriptionIcon />}
						>
							Submit
						</Button>
						<Dialog
							open={show}
							onClose={handleClose}
							aria-labelledby="alert-dialog-title"
							aria-describedby="alert-dialog-description"
						>
							<DialogTitle id="alert-dialog-title">{"Submit?"}</DialogTitle>
							<DialogContent>
								<DialogContentText id="alert-dialog-description">
									Once initiated, you can’t edit your disbursement anymore.
								</DialogContentText>
							</DialogContent>
							<DialogActions>
								<Button onClick={handleClose} color="primary">
									Go back to editing
								</Button>
								<Button onClick={handleDeployment} color="primary" autoFocus>
									Submit
								</Button>
							</DialogActions>
						</Dialog>
					</div>
				)}
			</Box>
		</Box>
	)

	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader app={MultiSend} isFetching={isFetching} refetch={refetch} />
			{started ? (
				<>
					{fetched && (
						<>
							<Box marginTop={2}>
								<Paper>
									{newDisbursement ? (
										<Box display="flex" flexDirection="column" p={8}>
											<Box display="flex" flexDirection="row">
												<Box display="flex" mr="auto">
													{!isDeployed ? (
														<h1 className={classes.h1}>New Disbursement</h1>
													) : isSubmitted ? (
														<h1 className={classes.h1}>
															Disbursement awaiting funds
														</h1>
													) : isInProgress ? (
														<h1 className={classes.h1}>
															Disbursement in progress
														</h1>
													) : (
														<h1 className={classes.h1}>Disbursement summary</h1>
													)}
												</Box>
												<Box display="flex" ml="auto">
													<IconButton color="primary" onClick={backToStart}>
														<UndoIcon />
													</IconButton>
												</Box>
											</Box>

											<Box display="flex" flexDirection="row">
												{transactionsListTable}
												{!canSend ? (
													<Box display="flex" flexDirection="column" p={2}>
														<Alert severity="warning">
															It seems that one of the addresses is not valid.
															Review your csv.
														</Alert>
													</Box>
												) : (
													<></>
												)}
												{previewDisbursementBox}
											</Box>
										</Box>
									) : (
										<Box display="flex" flexDirection="column" p={8}>
											<Box display="flex" flexDirection="row">
												<Box display="flex" mr="auto">
													<h1 className={classes.h1}>Verify Disbursement</h1>
												</Box>
												<Box display="flex" ml="auto">
													<IconButton color="primary" onClick={backToStart}>
														<UndoIcon />
													</IconButton>
												</Box>
											</Box>
											<Box display="flex" flexDirection="row">
												{transactionsListTable}
												{verifyContractBox}
											</Box>
										</Box>
									)}
								</Paper>
							</Box>
						</>
					)}
				</>
			) : (
				initialPage
			)}
		</Box>
	)
}
export default MultiSendApp

const getToken = async (erc20: string, contractKit: ContractKit) => {
	return erc20 === "CELO"
		? await contractKit.contracts.getGoldToken()
		: erc20 === "cUSD"
		? await contractKit.contracts.getStableToken(StableToken.cUSD)
		: await contractKit.contracts.getStableToken(StableToken.cEUR)
}

const newERC20 = async (kit: ContractKit, name: string, address?: string) => {
	switch (name) {
		case "CELO":
			address = await kit.registry.addressFor(CeloContract.GoldToken)
			break
		case "cUSD":
			address = await kit.registry.addressFor(CeloContract.StableToken)
			break
		case "cEUR":
			address = await kit.registry.addressFor(CeloContract.StableTokenEUR)
			break
	}
	if (!address) {
		throw new Error(`Unknown ERC20: ${name} - ${address}!`)
	}
	return new Erc20Contract(kit, address)
}
