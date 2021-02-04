import * as React from 'react'
import BigNumber from 'bignumber.js'

import { makeStyles } from '@material-ui/core/styles'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'
import { AddressOnlyAccountIcon, LedgerAccountIcon, LocalAccountIcon } from './accounts-app/account-icons'
import WifiIcon from '@material-ui/icons/Wifi'
import WifiOffIcon from '@material-ui/icons/WifiOff'

import { Account } from '../../lib/accounts'
import { fmtAddress } from '../../lib/utils'
import kit, { useNetworkURL } from '../state/kit'
import { CFG, networkName } from '../../lib/cfg'
import Tooltip from '@material-ui/core/Tooltip'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import { newKit } from '@celo/contractkit'
import LinearProgress from '@material-ui/core/LinearProgress'

const useStyles = makeStyles((theme) => ({
	name: {
		width: 120,
		fontFamily: "monospace",
		textOverflow: "ellipsis",
		overflow: "hidden",
		marginRight: 20,
	},
	address: {
		fontFamily: "monospace",
	},
	connected: {
		color: theme.palette.success.main,
	},
	disconnected: {
		color: theme.palette.error.main,
	},
}))

const AccountsBar = (props: {
	accounts: Account[],
	selectedAccount?: Account,
	onSelectAccount: (a: Account) => void,
	onError: (e: Error) => void,
}): JSX.Element => {
	const classes = useStyles()
	const [connected, setConnected] = React.useState(true)
	const maxBlockDelaySecs = 30000
	React.useEffect(() => {
		let errCnt = 0
    const timer = setInterval(async () => {
			const k = kit()
			try {
				const block = await k.web3.eth.getBlock('latest')
				if (!block || block.number <= 1) {
					throw new Error(`No latest block?`)
				}
				errCnt = 0
				const delaySecs = Date.now() / 1000 - new BigNumber(block.timestamp).toNumber()
				setConnected(delaySecs <= maxBlockDelaySecs)
			} catch (e) {
				errCnt += 1
				if (errCnt >= 2) {
					setConnected(false)
				}
			}
    }, maxBlockDelaySecs/6)
    return () => { clearInterval(timer) }
	}, [])
	const [networkURL, setNetworkURL] = useNetworkURL()
	const [openNetworkURL, setOpenNetworkURL] = React.useState(false)

	const handleOpenNetworkURL = () => { setOpenNetworkURL(true) }
	const handleCloseNetworkURL = (v: string) => {
		if (v !== networkURL) {
			setNetworkURL(v)
			setConnected(true)
		}
		setOpenNetworkURL(false)
	}
	const netName = networkName(CFG().networkId)
	return (
		<Box display="flex" flexDirection="row" justifyContent="flex-end" p={2}>
			{openNetworkURL &&
			<ChangeNetworkURL
				networkURL={networkURL}
				onClose={handleCloseNetworkURL}
				onError={props.onError} />}
			<Box display="flex" flexDirection="row" flex={1}>
				<Tooltip title={networkURL}>
					<Button
						endIcon={connected ?
							<WifiIcon className={classes.connected} /> :
							<WifiOffIcon className={classes.disconnected} />}
						onClick={handleOpenNetworkURL}
						>{netName}</Button>
				</Tooltip>
			</Box>
			<Select
				value={props.selectedAccount?.address || ""}
				onChange={(event) => {
					const selected = props.accounts.find((a) => a.address === event.target.value)
					if (selected) {
						props.onSelectAccount(selected)
					}
				}}>
				{
					props.accounts.map((a) => (
						<MenuItem value={a.address} key={a.address}>
							<Box display="flex" alignItems="center">
								<Box display="flex" alignSelf="flex-end" marginRight={1}>
								{
								a.type === "local" ? <LocalAccountIcon /> :
								a.type === "ledger" ? <LedgerAccountIcon style={{paddingRight: 5}} /> :
								a.type === "address-only" ? <AddressOnlyAccountIcon /> : <></>
								}
								</Box>
								<Typography className={classes.name}>{a.name}</Typography>
								<Typography className={classes.address}>{fmtAddress(a.address)}</Typography>
							</Box>
						</MenuItem>
					))
				}
			</Select>
		</Box>
	)
}

const ChangeNetworkURL = (props: {
	networkURL: string
	onClose: (v: string) => void
	onError: (e: Error) => void
}) => {
	const [networkURL, setNetworkURL] = React.useState(props.networkURL)
	const [isTesting, setIsTesting] = React.useState(false)
	const onError = props.onError
	const onClose = props.onClose
	React.useEffect(() => {
		if (!isTesting) {
			return
		}
		const kit = newKit(networkURL)
		kit.web3.eth.net
			.getId()
			.then((networkId) => {
				const cfgNetworkId = CFG().networkId
				if (networkId.toString() !== cfgNetworkId) {
					onError(new Error(`NetworkId doesn't match. Expected: ${cfgNetworkId}, Got: ${networkId}.`))
					setIsTesting(false)
				} else {
					onClose(networkURL)
				}
			})
			.catch((e) => {
				onError(e)
				setIsTesting(false)
			})
			.finally(() => {
				kit.stop()
			})
	}, [onError, onClose, isTesting, networkURL])
	const handleCancel = () => { onClose(props.networkURL) }
	const handleConnect = () => { setIsTesting(true) }
	return (
		<Dialog open={true} onClose={handleCancel}>
			<DialogTitle>Change Network</DialogTitle>
			<DialogContent style={{minWidth: 500}}>
				<TextField
					autoFocus
					margin="dense"
					label={`Network URL`}
					value={networkURL}
					size="medium"
					fullWidth={true}
					onChange={(e) => { setNetworkURL(e.target.value) }}
				/>
				<LinearProgress
					style={{visibility: !isTesting ? "hidden" : undefined}} color="primary" />
			</DialogContent>
			<DialogActions>
				<Button onClick={handleCancel}>Cancel</Button>
				<Button onClick={handleConnect} disabled={isTesting}>Connect</Button>
			</DialogActions>
		</Dialog>
	)
}

export default AccountsBar