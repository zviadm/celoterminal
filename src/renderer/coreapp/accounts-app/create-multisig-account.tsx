import { ContractKit } from '@celo/contractkit'
import { MultiSigAccount, Account } from '../../../lib/accounts'
import { TXFinishFunc, TXFunc } from '../../components/app-definition'

import * as React from 'react'
import {
	Dialog, DialogTitle, DialogContent, DialogActions,
	Button, TextField, Box, Typography
 } from '@material-ui/core'
import { Add } from '@material-ui/icons'

import NumberInput from '../../components/number-input'
import { multiSigDeployTXs, multiSigInitializeTXs } from '../../../lib/core-contracts/deploy'
import { sleep } from '../../../lib/utils'

const CreateMultiSigAccount = (props: {
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,

	onAdd: (a: MultiSigAccount) => void,
	onCancel: () => void,
}): JSX.Element => {
	const [requiredSigs, setRequiredSigs] = React.useState("1")
	const [requiredInternalSigs, setRequiredInternalSigs] = React.useState("1")
	const owners = [props.selectedAccount.address]
	const handleCreate = () => {
		const requiredSigsN = Number.parseInt(requiredSigs)
		const requiredInternalSigsN = Number.parseInt(requiredInternalSigs)

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
				// Delay a bit more to make sure TXs won't fail because node doens't
				// have up-to-date information about already deployed contracts.
				await sleep(500)
				const txs = multiSigInitializeTXs(
					kit,
					proxyAddress,
					multiSigAddress,
					owners,
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
					name: `MultiSig/${proxyAddress.slice(0, 6)}`,
					address: proxyAddress,
					ownerAddress: props.selectedAccount.address,
				})
			})
		})
	}
	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Create a new MultiSig account</DialogTitle>
			<DialogContent>
				<Box display="flex" flexDirection="column" width={350}>
					<Typography>Owners</Typography>
					<TextField
						margin="dense"
						value={props.selectedAccount.address}
						size="medium"
						fullWidth={true}
						disabled={true}
						inputProps={{style: {fontFamily: "monospace"}}}
					/>
					<Button startIcon={<Add />}>Add Owner</Button>
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
