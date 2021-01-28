import * as React from 'react'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import LedgerApp from '@ledgerhq/hw-app-eth'

import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'

import { LedgerAccount } from '../../state/accounts'
import { CELO_BASE_DERIVATION_PATH } from '@celo/wallet-ledger'
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
	const [verifyIdx, setVerifyIdx] = React.useState<number | undefined>()
	const onError = props.onError
	const onCancel = props.onCancel
	const onAdd = props.onAdd
	React.useEffect(() => {
		(async () => {
			const transport = await TransportNodeHid.open()
			console.info(`LEDGER: transport created to load addresses`)
			try {
				const ledgerApp = new LedgerApp(transport)
				const addrs: string[] = []
				for (let i = 0; i < 5; i++) {
					const a = await ledgerApp.getAddress(`${CELO_BASE_DERIVATION_PATH}/${i}`)
					addrs.push(a.address)
				}
				setAddresses(addrs)
			} finally {
				transport.close()
			}
		})()
		.catch((e) => {
			onError(e)
			onCancel()
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	React.useEffect(() => {
		if (verifyIdx === undefined) {
			return
		}
		(async () => {
			const transport = await TransportNodeHid.open()
			console.info(`LEDGER: transport created to verify address`)
			let addr
			try {
				const ledgerApp = new LedgerApp(transport)
				addr = await ledgerApp.getAddress(
					`${CELO_BASE_DERIVATION_PATH}/${verifyIdx}`, true)
			} finally {
				transport.close()
			}
			setVerifyIdx(undefined)
			onAdd({
				type: "ledger",
				name: `Ledger/${verifyIdx}`,
				address: addr.address,
				baseDerivationPath: CELO_BASE_DERIVATION_PATH,
				derivationPathIndex: verifyIdx,
			})
		})()
		.catch((e) => {
			setVerifyIdx(undefined)
			onError(e)
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [verifyIdx])

	const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(event.target.value);
	};
	const handleAdd = () => {
		setVerifyIdx(Number.parseInt(selected))
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
								control={<Radio disabled={verifyIdx !== undefined} />}
								label={<Typography style={{fontFamily: "monospace"}}>{v}</Typography>}
								/>
						))}
					</RadioGroup>
				</div>
				}
				{verifyIdx !== undefined &&
				<div>
					<Typography>Verify address on Ledger...</Typography>
				</div>}
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={!addresses || verifyIdx !== undefined}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}
export default AddLedgerAccount
