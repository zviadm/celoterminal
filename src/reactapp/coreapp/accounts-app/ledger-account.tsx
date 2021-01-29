import * as React from 'react'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import LedgerApp from '@ledgerhq/hw-app-eth'

import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import Button from '@material-ui/core/Button'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Typography from '@material-ui/core/Typography'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Radio from '@material-ui/core/Radio'
import LinearProgress from '@material-ui/core/LinearProgress'
import TextField from '@material-ui/core/TextField'
import PromptLedgerAction from '../prompt-ledger-action'

import { LedgerAccount } from '../../state/accounts'
import { CELO_BASE_DERIVATION_PATH } from '@celo/wallet-ledger'
import { expressLedgerErr } from '../ledger-utils'

const useStyles = makeStyles(() => ({
	content: {
		display: "flex",
		flexDirection: "column",
	},
	progressText: {
		fontStyle: "italic",
	},
	address: {
		fontFamily: "monospace",
	},
	verify: {
		alignSelf: "flex-end",
	},
}))

const AddLedgerAccount = (props: {
	onAdd: (a: LedgerAccount) => void,
	onCancel: () => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [addresses, setAddresses] = React.useState<string[] | undefined>()
	const [selected, setSelected] = React.useState("0")
	const [customPath, setCustomPath] = React.useState(CELO_BASE_DERIVATION_PATH + "/")
	const [verifyPath, setVerifyPath] = React.useState<string | undefined>()
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
			onError(expressLedgerErr(e))
			onCancel()
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	React.useEffect(() => {
		const derivationPath = verifyPath
		if (derivationPath === undefined) {
			return
		}
		(async () => {
			const parts = derivationPath.split("/")
			if (parts.length < 2 ||
				Number.parseInt(parts[parts.length - 1]).toString() !== parts[parts.length - 1]) {
				throw new Error(`Invalid derivation path: ${derivationPath}`)
			}
			const pathIdx = Number.parseInt(parts[parts.length - 1])
			const basePath = parts.slice(0, parts.length - 1).join("/")

			let addr
			const transport = await TransportNodeHid.open()
			try {
				console.info(`LEDGER: transport created to verify address`)
				const ledgerApp = new LedgerApp(transport)
				addr = await ledgerApp.getAddress(
					`${basePath}/${pathIdx}`, true)
			} finally {
				transport.close()
			}
			setVerifyPath(undefined)
			onAdd({
				type: "ledger",
				name: `Ledger/${pathIdx}`,
				address: addr.address,
				baseDerivationPath: basePath,
				derivationPathIndex: pathIdx,
			})
		})()
		.catch((e) => {
			setVerifyPath(undefined)
			onError(expressLedgerErr(e))
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [verifyPath])

	const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(event.target.value);
	};
	const handleAdd = () => {
		if (selected === "custom") {
			setVerifyPath(customPath)
		} else {
			setVerifyPath(`${CELO_BASE_DERIVATION_PATH}/${selected}`)
		}
	}

	return (
		<Dialog open={true} onClose={props.onCancel}>
			<DialogTitle>Choose a Ledger account</DialogTitle>
			<DialogContent className={classes.content}>
				{
				!addresses ?
				<div>
					<Typography
						className={classes.progressText}
						color="textSecondary">Loading addresses...</Typography>
					<LinearProgress color="secondary" />
				</div>
				:
				<div>
					<RadioGroup value={selected} onChange={handleSelect}>
						{addresses.map((v, idx) => (
							<FormControlLabel
								key={`${idx}`}
								value={`${idx}`}
								control={<Radio disabled={verifyPath !== undefined} />}
								label={<Typography className={classes.address}>{v}</Typography>}
								/>
						))}
						<FormControlLabel
							value={`custom`}
							control={<Radio disabled={verifyPath !== undefined} />}
							label={<Typography color="textSecondary">Custom</Typography>}
							/>
					</RadioGroup>
					{selected === "custom" &&
					<TextField
							autoFocus
							margin="dense"
							label={`Derivation Path`}
							value={customPath}
							size="medium"
							fullWidth={true}
							inputProps={{className: classes.address}}
							onChange={(e) => { setCustomPath(e.target.value) }}
						/>
					}
				</div>
				}
				{verifyPath !== undefined &&
				<div className={classes.verify}>
					<PromptLedgerAction text="Verify address on Ledger..." />
				</div>}
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={!addresses || verifyPath !== undefined}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}
export default AddLedgerAccount
