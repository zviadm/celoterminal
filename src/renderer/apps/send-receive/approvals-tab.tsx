import { ContractKit } from '@celo/contractkit'

import useOnChainState from '../../state/onchain-state'
import { newErc20 } from '../../../lib/erc20/erc20-contract'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { Account } from '../../../lib/accounts/accounts'
import { fmtAmount } from '../../../lib/utils'

import * as React from 'react'
import {
	Button, LinearProgress, TableHead, Table,
	TableRow, TableCell, Box, TableBody, Typography
} from '@material-ui/core'
import Add from '@material-ui/icons/Add'

import SectionTitle from '../../components/section-title'
import LinkedAddress from '../../components/linked-address'

const ApprovalsTab = (props: {
	erc20: RegisteredErc20,
	selectedAccount: Account,
	owners: string[],
	spenders: string[],
	addressBook: Account[], // TODO(zviad): This type should be different.
}): JSX.Element => {
	const owners = props.owners
	const spenders = props.spenders
	const erc20 = props.erc20
	const selectedAddress = props.selectedAccount.address
	const {
		isFetching,
		fetched,
		// refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const contract = await newErc20(kit, erc20)
			const ownerAllowances = await Promise.all(owners.map((a) => contract.allowance(a, selectedAddress)))
			const spenderAllowances = await Promise.all(spenders.map((a) => contract.allowance(selectedAddress, a)))
			const byOwner =
				owners.map((a, idx) => ({owner: a, allowance: ownerAllowances[idx]})).filter((x) => x.allowance.gt(0))
			const bySpender =
				spenders.map((a, idx) => ({spender: a, allowance: spenderAllowances[idx]})).filter((x) => x.allowance.gt(0))
			return {
				byOwner,
				bySpender,
			}
		},
		[selectedAddress, erc20, owners, spenders]
	))

	return <>
		{isFetching && <LinearProgress />}
		{fetched && <>
		<Box display="flex" flexDirection="column">
			<SectionTitle>Authorized spenders</SectionTitle>
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
								<TableRow key={s.spender}>
									<TableCell><LinkedAddress address={s.spender} /></TableCell>
									<TableCell style={{whiteSpace: "nowrap"}} align="right">
										{fmtAmount(s.allowance, props.erc20.decimals)} {props.erc20.symbol}
									</TableCell>
								</TableRow>
							)
						})
					}
				</TableBody>
			</Table>}
			<Button
				color="primary"
				startIcon={<Add />}>
				Approve Spender
			</Button>
		</Box>
		<Box display="flex" flexDirection="column" marginTop={2}>
			<SectionTitle>Authorized sources</SectionTitle>
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
								<TableRow key={o.owner}>
									<TableCell><LinkedAddress address={o.owner} /></TableCell>
									<TableCell style={{whiteSpace: "nowrap"}} align="right">
										{fmtAmount(o.allowance, props.erc20.decimals)} {props.erc20.symbol}
									</TableCell>
								</TableRow>
							)
						})
					}
				</TableBody>
			</Table>}
		</Box>
		</>}
	</>
}
export default ApprovalsTab