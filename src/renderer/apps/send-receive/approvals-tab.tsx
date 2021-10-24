import BigNumber from 'bignumber.js'
import { ContractKit } from '@celo/contractkit'

import useOnChainState from '../../state/onchain-state'
import { newErc20 } from '../../../lib/erc20/erc20-contract'
import { Erc20InfiniteThreshold, RegisteredErc20 } from '../../../lib/erc20/core'
import { Account } from '../../../lib/accounts/accounts'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	Button, TableHead, Table,
	TableRow, TableCell, Box, TableBody, Typography, ButtonBase
} from '@material-ui/core'
import Add from '@material-ui/icons/Add'

import SectionTitle from '../../components/section-title'
import LinkedAddress from '../../components/linked-address'
import ApproveSpender from './approve-spender'
import HiddenProgress from './hidden-progress'
import { contractNamesByAddress } from '../../../lib/tx-parser/contract-abi'

const ApprovalsTab = (props: {
	erc20: RegisteredErc20,
	account: Account,
	accountData: {
		owners: string[],
		spenders: string[],
	},
	addressBook: Account[], // TODO(zviad): This type should be different.
	onApprove: (spender: string, amount: BigNumber) => void
}): JSX.Element => {
	const accountDataRef = React.useRef(props.accountData)
	const erc20 = props.erc20
	const selectedAddress = props.account.address
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const owners = accountDataRef.current.owners
			const spenders = accountDataRef.current.spenders
			const contract = await newErc20(kit, erc20)
			const ownerAllowances = await Promise.all(owners.map((a) => contract.allowance(a, selectedAddress)))
			const spenderAllowances = await Promise.all(spenders.map((a) => contract.allowance(selectedAddress, a)))
			const byOwner =
				owners.map((a, idx) => ({owner: a, allowance: ownerAllowances[idx]})).filter((x) => x.allowance.gt(0))
			const bySpender =
				spenders.map((a, idx) => ({spender: a, allowance: spenderAllowances[idx]})).filter((x) => x.allowance.gt(0))
			const nameMapping = await contractNamesByAddress(
				kit, [
					...byOwner.map((o) => o.owner),
					...bySpender.map((s) => s.spender),
				])
			return {
				byOwner,
				bySpender,
				nameMapping,
			}
		},
		[selectedAddress, erc20, accountDataRef]
	))

	const accountData = props.accountData
	React.useEffect(() => {
		if (accountDataRef.current !== accountData) {
			accountDataRef.current = accountData
			refetch()
		}
	}, [refetch, accountData])

	const [showApprove, setShowApprove] = React.useState<undefined | {
		spender?: string,
		allowance?: BigNumber,
	}>()

	const handleApprove = (spender: string, amount: BigNumber) => {
		setShowApprove(undefined)
		props.onApprove(spender, amount)
	}

	return <>
		{showApprove !== undefined &&
		<ApproveSpender
			erc20={props.erc20}
			account={props.account}
			spender={showApprove.spender}
			currentAllowance={showApprove.allowance}
			onCancel={() => { setShowApprove(undefined) }}
			onApprove={handleApprove}
		/>}
		<Box display="flex" flexDirection="column">
			<SectionTitle>Approved spenders</SectionTitle>
			<HiddenProgress hidden={!isFetching} />
			{fetched && <>
				{fetched.bySpender.length === 0 ?
				<Typography variant="body2" color="textSecondary">
					No accounts are authorized to spend on behalf of this accouunt.
				</Typography>
				:
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell width="100%">Spender</TableCell>
							<TableCell style={{whiteSpace: "nowrap"}} align="right">Authorized Amount</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{
							fetched.bySpender.map((s) => {
								return (
									<TableRow key={`spender-${s.spender}`}>
										<TableCell><LinkedAddress address={s.spender} name={fetched.nameMapping.get(s.spender)} /></TableCell>
										<TableCell style={{whiteSpace: "nowrap"}} align="right">
											<ButtonBase
												onClick={() => { setShowApprove({spender: s.spender, allowance: s.allowance}) }}>
												{fmtAllowance(props.erc20, s.allowance)} {props.erc20.symbol}
											</ButtonBase>
										</TableCell>
									</TableRow>
								)
							})
						}
					</TableBody>
				</Table>}
				<Button
					color="primary"
					startIcon={<Add />}
					onClick={() => { setShowApprove({}) }}>
					Approve Spender
				</Button>
			</>}
		</Box>
		<Box display="flex" flexDirection="column" marginTop={2}>
			<SectionTitle>Available sources</SectionTitle>
			<HiddenProgress hidden={!isFetching} />
			{fetched && <>
				{fetched.byOwner.length === 0 ?
				<Typography variant="body2" color="textSecondary">
					No sources found that have authorized spending for this account.
				</Typography>
				:
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell width="100%">Source</TableCell>
							<TableCell style={{whiteSpace: "nowrap"}}>Authorized Amount</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{
							fetched.byOwner.map((o) => {
								return (
									<TableRow key={`owner-${o.owner}`}>
										<TableCell><LinkedAddress address={o.owner} name={fetched.nameMapping.get(o.owner)} /></TableCell>
										<TableCell style={{whiteSpace: "nowrap"}} align="right">
											{fmtAllowance(props.erc20, o.allowance)} {props.erc20.symbol}
										</TableCell>
									</TableRow>
								)
							})
						}
					</TableBody>
				</Table>}
			</>}
		</Box>
	</>
}
export default ApprovalsTab

const fmtAllowance = (erc20: RegisteredErc20, allowance: BigNumber) => {
	if (allowance.gte(Erc20InfiniteThreshold)) {
		return "Unlimited"
	}
	return fmtAmount(allowance, erc20.decimals)
}