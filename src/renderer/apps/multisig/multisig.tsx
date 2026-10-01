import { ContractKit } from '@celo/contractkit'
import { AbiItem, toTransactionObject } from '@celo/connect'

import { Account } from '../../../lib/accounts/accounts'
import { CancelPromise } from '../../../lib/utils'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { MultiSig } from './def'
import useOnChainState from '../../state/onchain-state'

import * as React from 'react'
import { Box, LinearProgress, Tab, Typography } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'

import AppContainer from '../../components/app-container'
import AppHeader from '../../components/app-header'
import AppSection from '../../components/app-section'
import SectionTitle from '../../components/section-title'
import { OwnersTable, SignaturesTable } from './owners'
import { TransactionsTable } from './transactions'
import { parseTXs } from './parse-txs'

const pendingIdsAbi: AbiItem[] = [{
	constant: true,
	inputs: [
		{name: "from", type: "uint256"},
		{name: "to", type: "uint256"},
		{name: "pending", type: "bool"},
		{name: "executed", type: "bool"},
	],
	name: "getTransactionIds",
	outputs: [{name: "_transactionIds", type: "uint256[]"}],
	payable: false,
	stateMutability: "view",
	type: "function",
}, {
	constant: true,
	inputs: [{name: "transactionId", type: "uint256"}],
	name: "getConfirmations",
	outputs: [{name: "_confirmations", type: "address[]"}],
	payable: false,
	stateMutability: "view",
	type: "function",
}]

function addressList(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return []
	}
	return value.filter((item): item is string => typeof item === "string")
}

const MultiSigApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const account = props.selectedAccount
	const [progress, setProgress] = React.useState<{
		label: string,
		done?: number,
		total?: number,
	}>()
	const {
		fetched,
		isFetching,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit, c: CancelPromise) => {
			if (account.type !== "multisig") {
				return {}
			}
			setProgress({label: "Loading pending transactions…"})
			const multiSig = await kit.contracts.getMultiSig(account.address)
			const pendingCount = await multiSig.getTransactionCount(true, false)
			const [
				pendingIds,
				owners,
				requiredSignatures,
				internalRequiredSignatures,
			] = await Promise.all([
				pendingCount === 0 ? Promise.resolve([] as string[]) :
					new kit.web3.eth.Contract(pendingIdsAbi, account.address).methods
						.getTransactionIds(0, pendingCount, true, false).call() as Promise<string[]>,
				multiSig.getOwners(),
				multiSig.getRequired(),
				multiSig.getInternalRequired(),
			])
			// One transactions() call plus one getConfirmations() call, in order.
			// The contractkit helper checks every owner separately, which is
			// about 11 calls per transaction and trips free-plan rate limits.
			const reader = new kit.web3.eth.Contract(pendingIdsAbi, account.address)
			const pendingTXsRaw = []
			for (let i = 0; i < pendingIds.length; i++) {
				if (c.isCancelled()) {
					return {}
				}
				setProgress({
					label: `Loading transaction ${i + 1} of ${pendingIds.length}…`,
					done: i,
					total: pendingIds.length,
				})
				const idx = Number(pendingIds[i])
				const tx = await multiSig.getTransaction(idx, false)
				const confirmedBy: unknown = await reader.methods.getConfirmations(idx).call()
				pendingTXsRaw.push({
					...tx,
					confirmations: addressList(confirmedBy),
					idx,
				})
			}
			if (c.isCancelled()) {
				return {}
			}
			pendingTXsRaw.sort((a, b) => b.idx - a.idx)
			const pendingTXs = await parseTXs(kit, pendingTXsRaw, (done, total) => {
				if (c.isCancelled()) {
					return
				}
				setProgress({
					label: `Looking up contract ${Math.min(done + 1, total)} of ${total}…`,
					done,
					total,
				})
			})
			if (c.isCancelled()) {
				return {}
			}
			return {
				pendingTXs,
				owners,
				requiredSignatures,
				internalRequiredSignatures,
			}
		},
		[account]
	))
	const [tab, setTab] = React.useState("transactions")
	React.useEffect(() => {
		if (!isFetching) {
			setProgress(undefined)
		}
	}, [isFetching])

	const handleAddOwner = (newOwner: string) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.addOwner(newOwner))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}
	const handleRemoveOwner = (owner: string) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.removeOwner(owner))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}
	const handleReplaceOwner = (owner: string, newOwner: string) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.replaceOwner(owner, newOwner))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}
	const handleChangeRequiredSignatures = (signatures: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.changeRequirement(signatures))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}
	const handleChangeInternalRequiredSignatures = (signatures: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.changeInternalRequirement(signatures))
				return [{tx: tx}]
			},
			() => { refetch() },
		)
	}

	const handleExecuteTX = (txIdx: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.executeTransaction(txIdx))
				return [{tx: tx, executeUsingParentAccount: true}]
			},
			() => { refetch() },
		)
	}
	const handleConfirmTX = (txIdx: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.confirmTransaction(txIdx))
				return [{tx: tx, executeUsingParentAccount: true}]
			},
			() => { refetch() },
		)
	}
	const handleRevokeTX = (txIdx: number) => {
		props.runTXs(
			async (kit: ContractKit) => {
				const multiSig = await kit._web3Contracts.getMultiSig(account.address)
				const tx = toTransactionObject(
					kit.connection,
					multiSig.methods.revokeConfirmation(txIdx))
				return [{tx: tx, executeUsingParentAccount: true}]
			},
			() => { refetch() },
		)
	}

	return (
		<AppContainer>
			<AppHeader app={MultiSig} isFetching={isFetching} refetch={refetch} />
			{account.type === "multisig" && isFetching &&
			<AppSection>
				<Box display="flex" alignItems="center" marginBottom={1}>
					<Typography>{progress?.label || "Loading transactions…"}</Typography>
				</Box>
				{progress?.total ?
				<LinearProgress
					variant="determinate"
					value={(100 * (progress.done || 0)) / progress.total}
				/> :
				<LinearProgress />}
			</AppSection>}
			{account.type !== "multisig" ?
			<AppSection>
				<Alert severity="info">
					Select MultiSig type account using the account selector. You can create
					or import MultiSig accounts in the Accounts app.
				</Alert>
			</AppSection> : fetched && <>
			<TabContext value={tab}>
				<AppSection innerPadding={0}>
					<TabList onChange={(e, v) => { setTab(v) }}>
						<Tab label="Transactions" value={"transactions"} />
						<Tab label="Owners" value={"owners"} />
					</TabList>
					<TabPanel value="transactions">
						{!fetched?.pendingTXs?.length ?
						<Alert severity="info">
							There are no pending transactions.
						</Alert> :
						<TransactionsTable
							account={account}
							requiredSignatures={fetched.requiredSignatures.toNumber()}
							internalRequiredSignatures={fetched.internalRequiredSignatures.toNumber()}
							pendingTXs={fetched.pendingTXs}
							onExecute={handleExecuteTX}
							onConfirm={handleConfirmTX}
							onRevoke={handleRevokeTX}
						/>}
					</TabPanel>
					<TabPanel value="owners">
						<OwnersTable
							owners={fetched.owners || []}
							onAdd={handleAddOwner}
							onRemove={handleRemoveOwner}
							onReplace={handleReplaceOwner}
						/>
					</TabPanel>
				</AppSection>
				{tab === "owners" && <>
				<AppSection>
					<SectionTitle>Required signatures</SectionTitle>
					<SignaturesTable
						requiredSignatures={fetched?.requiredSignatures?.toNumber() || 0}
						internalRequiredSignatures={fetched?.internalRequiredSignatures?.toNumber() || 0}
						onChangeRequiredSignatures={handleChangeRequiredSignatures}
						onChangeInternalRequiredSignatures={handleChangeInternalRequiredSignatures}
					/>
				</AppSection>
				</>}
			</TabContext>
			</>}
		</AppContainer>
	)
}
export default MultiSigApp
