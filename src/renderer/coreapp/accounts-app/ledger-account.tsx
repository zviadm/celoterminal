import * as React from 'react'
import log from 'electron-log'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-noevents'
import LedgerApp from '@ledgerhq/hw-app-eth'
import { CELO_BASE_DERIVATION_PATH } from '@celo/wallet-ledger'

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
import PromptLedgerAction from '../tx-runner/prompt-ledger-action'
import Box from '@material-ui/core/Box'

import { LedgerAccount } from '../../../lib/accounts'
import { transformError } from '../ledger-utils'
import { UserError } from '../../../lib/error'

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
}))

const AddLedgerAccount = (props: {
	onAdd: (a: LedgerAccount) => void,
	onCancel: () => void,
}): JSX.Element => {
	const classes = useStyles()
	const [addresses, setAddresses] = React.useState<string[] | undefined>()
	const [selected, setSelected] = React.useState("0")
	const [customPath, setCustomPath] = React.useState(CELO_BASE_DERIVATION_PATH + "/")
	const [verifyPath, setVerifyPath] = React.useState<string | undefined>()

	// Parent is not expected to change onAdd/onCancel functions once this component is
	// mounted. It is safer to memoize this stuff here since otherwise re-render can cause
	// more issues since we are creating transports for Ledger device.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const onCancel = React.useCallback(props.onCancel, [])
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const onAdd = React.useCallback(props.onAdd, [])
	React.useEffect(() => {
		(async () => {
			const transport = await TransportNodeHid.open()
			log.info(`LEDGER: transport created to load addresses`)
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
			onCancel()
			throw transformError(e)
		})
	}, [onCancel])
	React.useEffect(() => {
		if (verifyPath === undefined) {
			return
		}
		(async () => {
			const parts = verifyPath.split("/")
			if (parts.length < 2 ||
				Number.parseInt(parts[parts.length - 1]).toString() !== parts[parts.length - 1]) {
				throw new UserError(`Invalid derivation path: ${verifyPath}`)
			}
			const pathIdx = Number.parseInt(parts[parts.length - 1])
			const basePath = parts.slice(0, parts.length - 1).join("/")

			let addr
			const transport = await TransportNodeHid.open()
			try {
				log.info(`LEDGER: transport created to verify address`)
				const ledgerApp = new LedgerApp(transport)
				addr = await ledgerApp.getAddress(
					`${basePath}/${pathIdx}`, true)
			} finally {
				transport.close()
			}
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
			throw transformError(e)
		})
	}, [onAdd, verifyPath])

	const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => { setSelected(event.target.value) }
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
			<DialogContent>
				<Box display="flex" flexDirection="column">
					{
					!addresses ?
					<Box>
						<Typography
							className={classes.progressText}
							color="textSecondary">Loading addresses...</Typography>
						<LinearProgress color="secondary" />
					</Box>
					:
					<Box>
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
					</Box>
					}
					{verifyPath !== undefined &&
					<Box alignSelf="flex-end">
						<PromptLedgerAction text="Verify address on Ledger..." />
					</Box>}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={props.onCancel}>Cancel</Button>
				<Button onClick={handleAdd} disabled={!addresses || verifyPath !== undefined}>Add</Button>
			</DialogActions>
		</Dialog>
	)
}
export default AddLedgerAccount
