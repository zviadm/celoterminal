import { ContractKit } from '@celo/contractkit'
import { isValidAddress } from 'ethereumjs-util'

import { MultiSigAccount, Account } from '../../../lib/accounts/accounts'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'
import { multiSigDeployTXs, multiSigInitializeTXs } from '../../../lib/core-contracts/deploy'
import { sleep } from '../../../lib/utils'

import * as React from 'react'
import {
	Dialog, DialogTitle, DialogContent, DialogActions,
	Button, TextField, Box, Typography, InputAdornment, IconButton
 } from '@material-ui/core'
import { Add, Clear } from '@material-ui/icons'

import NumberInput from '../../components/number-input'
import { UserError } from '../../../lib/error'

const CreateMultiSigAccount = (props: {
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,

	onAdd: (a: MultiSigAccount) => void,
	onCancel: () => void,
}): JSX.Element => {
	const [requiredSigs, setRequiredSigs] = React.useState("1")
	const [requiredInternalSigs, setRequiredInternalSigs] = React.useState("1")
	const [owners, setOwners] = React.useState<string[]>([])

	const handleAddOwner = () => {
		setOwners((o) => [...o, ""])
	}
	const handleEditOwner = (idx: number, v: string) => {
		setOwners((o) => [...o.slice(0, idx), v, ...o.slice(idx+1)])
	}
	const handleRemoveOwner = (idx: number) => {
		setOwners((o) => [...o.slice(0, idx), ...o.slice(idx+1)])
	}

	const account = props.selectedAccount
	const handleCreate = () => {
		const requiredSigsN = Number.parseInt(requiredSigs)
		const requiredInternalSigsN = Number.parseInt(requiredInternalSigs)
		const ownersAll = [account.address, ...owners]
		ownersAll.forEach((o) => {
			if (!isValidAddress(o)) {
				throw new UserError(`Invalid owner address: ${o}`)
			}
		})
		if (new Set(ownersAll).size !== ownersAll.length) {
			throw new UserError(`All owners must be unique.`)
		}
		if (requiredSigsN > ownersAll.length || requiredInternalSigsN > ownersAll.length) {
			throw new UserError(`Required signatures must be less than or equal to the number of owners.`)
		}

		props.runTXs(async (kit: ContractKit) => {
			const txs = multiSigDeployTXs(kit)
			return txs
		}, (e, r) => {
			if (e || !r) {
				return
			}
			const proxyAddress = r[0].contractAddress
			const multiSigAddress = r[1].contractAddress
			if (!proxyAddress || !multiSigAddress) {
				throw new Error(`Unexpected error while deploying MultiSig contracts.`)
			}
			props.runTXs(async (kit: ContractKit) => {
				// Delay a bit more to make sure TXs won't fail because node doesn't
				// have up-to-date information about already deployed contracts.
				await sleep(500)
				const txs = multiSigInitializeTXs(
					kit,
					proxyAddress,
					multiSigAddress,
					ownersAll,
					requiredSigsN,
					requiredInternalSigsN
				)
				return txs
			}, (e) => {
				if (e) {
					return
				}
				props.onAdd({
					type: "multisig",
					name: `MultiSig/${account.address.slice(0, 6)}`,
					address: proxyAddress,
					ownerAddress: account.address,
				})
			})
		})
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Create MultiSig account</DialogTitle>
			<DialogContent>
				<Box display="flex" flexDirection="column" width={380}>
					<Typography>Owners</Typography>
					<TextField
						margin="dense"
						value={account.address}
						size="medium"
						fullWidth={true}
						disabled={true}
						inputProps={{style: {fontFamily: "monospace"}}}
					/>
					{
						owners.map((o, idx) => (
							<TextField
								key={`owner-${idx}`}
								margin="dense"
								size="medium"
								fullWidth={true}
								inputProps={{style: {fontFamily: "monospace"}}}
								placeholder="0x..."
								value={o}
								onChange={(e) => { handleEditOwner(idx, e.target.value) }}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												size="small"
												onClick={() => { handleRemoveOwner(idx) }}>
												<Clear />
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
						))
					}
					<Button
						startIcon={<Add />}
						onClick={handleAddOwner}
						>Add Owner</Button>
					<NumberInput
						margin="dense"
						label="Signatures required to execute TXs"
						InputLabelProps={{ shrink: true }}
						value={requiredSigs}
						onChangeValue={setRequiredSigs}
					/>
					<NumberInput
						margin="dense"
						label="Signatures required to change MultiSig properties"
						InputLabelProps={{ shrink: true }}
						value={requiredInternalSigs}
						onChangeValue={setRequiredInternalSigs}
					/>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleCreate}>Create</Button>
			</DialogActions>
		</Dialog>
	)
}
export default CreateMultiSigAccount
