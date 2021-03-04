import { ContractKit } from '@celo/contractkit'

import { MultiSigAccount, Account } from '../../../lib/accounts'

import * as React from 'react'
import {
	Dialog, DialogTitle, DialogContent, DialogActions,
	Button, Box, Typography, LinearProgress
 } from '@material-ui/core'

import useOnChainState from '../../state/onchain-state'
import AddressAutocomplete from '../../components/address-autocomplete'

const ModifyMultiSig = (props: {
	account: MultiSigAccount,
	accounts: Account[],
	onChangeOwner: (newOwner: string) => void,
	onClose: () => void,
}): JSX.Element => {
	const multiSigAddress = props.account.address
	const {
		fetched,
		isFetching,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const multiSig = await kit.contracts.getMultiSig(multiSigAddress)
			const owners = await multiSig.getOwners()
			return {owners}
		},
		[multiSigAddress]
	))
	const accounts = props.accounts
	const ownerOptions =
		fetched ? accounts.filter((a) => fetched.owners.indexOf(a.address) >= 0) : []
	return (
		<Dialog open={true} onClose={props.onClose}>
			<DialogTitle>MultiSig account</DialogTitle>
			<DialogContent>
				{isFetching ? <LinearProgress /> :
				<Box display="flex" flexDirection="column" width={420}>
					<Typography>Choose associated owner</Typography>
					<AddressAutocomplete
						id="multisig-owner-input"
						noFreeSolo={true}
						addresses={ownerOptions}
						address={props.account.ownerAddress}
						onChange={(o) => {
							if (o !== props.account.ownerAddress) {
								props.onChangeOwner(o)
							}
						}}
					/>
				</Box>}
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onClose}>Close</Button>
			</DialogActions>
		</Dialog>
	)
}
export default ModifyMultiSig
