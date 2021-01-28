import * as React from 'react'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import { zeroRange } from '@celo/base/lib/collections'

import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'

import { LedgerAccount } from '../../state/accounts'
import { AddressValidation, CELO_BASE_DERIVATION_PATH, newLedgerWalletWithSetup } from '@celo/wallet-ledger'
import Typography from '@material-ui/core/Typography'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Radio from '@material-ui/core/Radio'

const AddLedgerAccount = (props: {
	onAdd: (a: LedgerAccount) => void,
	onCancel: () => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const [addresses, setAddresses] = React.useState<string[] | undefined>()
	const [selected, setSelected] = React.useState("0")
	const onError = props.onError
	const onCancel = props.onCancel
	React.useEffect(() => {
		(async () => {
			const transport = await TransportNodeHid.open()
			console.info(`LEDGER: transport created`)
			try {
				const w = await newLedgerWalletWithSetup(
					transport,
					zeroRange(5),
					CELO_BASE_DERIVATION_PATH,
					AddressValidation.never)
				setAddresses(w.getAccounts())
				// const ledgerApp = new Ledger(transport)
				// const p = []
				// for (let i = 0; i < 10; i++) {
				// 	p.push(
				// 		ledgerApp.getAddress(`${CELO_BASE_DERIVATION_PATH}/${i}`))
				// }
				// const addrs = (await Promise.all(p)).map((a) => a.address)
				// setAddresses(addrs)
			} finally {
				transport.close()
			}
		})()
		.catch((e) => {
			onError(e)
			onCancel()
		})
	}, [onError, onCancel])

	const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(event.target.value);
	};
	const handleAdd = () => {
		if (!addresses) {
			return
		}
		const selectedIdx = Number.parseInt(selected)
		const address = addresses[selectedIdx]
		props.onAdd({
			type: "ledger",
			name: `Ledger/${selectedIdx}`,
			address: address,
			baseDerivationPath: CELO_BASE_DERIVATION_PATH,
			derivationPathIndex: selectedIdx,
		})
	}

	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Choose Ledger Account</DialogTitle>
			<DialogContent>
				{
				!addresses ?
				<div>
					<Typography>Loading addresses...</Typography>
				</div>
				:
				<div>
					<RadioGroup value={selected} onChange={handleSelect}>
						{addresses.map((v, idx) => (
							<FormControlLabel
								key={`${idx}`}
								value={`${idx}`}
								control={<Radio />}
								label={<Typography style={{fontFamily: "monospace"}}>{v}</Typography>}
								/>
						))}
					</RadioGroup>
				</div>
				}
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={!addresses}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}
export default AddLedgerAccount
