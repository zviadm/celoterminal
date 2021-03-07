import { ContractKit } from '@celo/contractkit'
import { isValidAddress } from 'ethereumjs-util'

import { MultiSigAccount, Account } from '../../../lib/accounts/accounts'

import * as React from 'react'
import {
	Dialog, DialogTitle, DialogContent, DialogActions,
	Button, Box, LinearProgress, TextField
 } from '@material-ui/core'

import useOnChainState from '../../state/onchain-state'
import AddressAutocomplete from '../../components/address-autocomplete'
import Alert from '@material-ui/lab/Alert'

const ImportMultiSigAccount = (props: {
	accounts: Account[],
	onAdd: (a: MultiSigAccount) => void,
	onCancel: () => void,
}): JSX.Element => {
	const [address, setAddress] = React.useState("")
	const multiSigAddress = isValidAddress(address) ? address : undefined
	const {
		fetched,
		isFetching,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			if (!multiSigAddress) {
				return {}
			}
			const multiSig = await kit.contracts.getMultiSig(multiSigAddress)
			const owners = await multiSig.getOwners()
			return {owners}
		},
		[multiSigAddress]
	))
	const [_ownerAddress, setOwnerAddress] = React.useState("")

	const accounts = props.accounts
	const ownerOptions =
		fetched?.owners ? accounts.filter((a) => fetched.owners.indexOf(a.address) >= 0) : []
	const ownerAddress =
		ownerOptions.find((a) => a.address === _ownerAddress) ? _ownerAddress : ownerOptions[0]?.address
	const canAdd = !!multiSigAddress && !!ownerAddress
	const handleAdd = () => {
		if (!multiSigAddress || !ownerAddress) {
			return
		}
		props.onAdd({
			type: "multisig",
			name: `MultiSig/${ownerAddress.slice(0, 6)}`,
			address: multiSigAddress,
			ownerAddress: ownerAddress,
		})
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Import MultiSig account</DialogTitle>
			<DialogContent>
				<Box display="flex" flexDirection="column" width={420}>
					<TextField
						id="multisig-address-input"
						margin="dense"
						size="medium"
						fullWidth={true}
						inputProps={{style: {fontFamily: "monospace"}, spellCheck: false}}
						InputLabelProps={{shrink: true}}
						label="MultiSig address"
						placeholder="0x..."
						value={address}
						onChange={(e) => { setAddress(e.target.value) }}
					/>
					{isFetching && <LinearProgress />}
					<Box display="flex" flexDirection="column" marginTop={1}>
						{fetched?.owners && (ownerOptions.length === 0 ?
							<Alert severity="error">None of your accounts have access to this MultiSig contract.</Alert> :
							<AddressAutocomplete
								id="multisig-owner-input"
								textFieldProps={{label: "Owner account"}}
								noFreeSolo={true}
								addresses={ownerOptions}
								address={ownerAddress}
								onChange={setOwnerAddress}
							/>
						)}
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={!canAdd}>Import</Button>
			</DialogActions>
		</Dialog>
	)
}
export default ImportMultiSigAccount
