import BigNumber from 'bignumber.js'
import { BlockHeader } from '@celo/connect'
import { secondsToDurationString } from '@celo/contractkit/lib/wrappers/BaseWrapper'

import kitInstance, { useNetworkURL } from '../state/kit'
import { newKitWithTimeout } from '../../lib/kit-utils'
import { CFG, networkName } from '../../lib/cfg'
import { UserError } from '../../lib/error'
import { nowMS } from '../state/time'

import * as React from 'react'
import {
	makeStyles, Tooltip, Button, Dialog, DialogTitle,
	DialogContent, DialogActions, TextField, LinearProgress,
} from '@material-ui/core'
import Wifi from '@material-ui/icons/Wifi'
import WifiOff from '@material-ui/icons/WifiOff'

const useStyles = makeStyles((theme) => ({
	connected: {
		color: theme.palette.success.main,
	},
	disconnected: {
		color: theme.palette.error.main,
	},
}))

const NetworkIndicator = (): JSX.Element => {
	const classes = useStyles()
	const [connected, setConnected] = React.useState(true)
	const [connectErr, setConnectErr] = React.useState("")
	const expectedBlockMs = 5000
	const blockRefetchMs = 600000
	React.useEffect(() => {
		let errCnt = 0
		let lastBlock: BlockHeader
		const maxBlockDelayMs = 3 * expectedBlockMs
		const timer = setInterval(async () => {
			const k = kitInstance()
			try {
				let blockN: number
				if (!lastBlock ||
					new BigNumber(lastBlock.timestamp)
					.multipliedBy(1000)
					.plus(blockRefetchMs)
					.lt(nowMS())) {
					lastBlock = await k.web3.eth.getBlock('latest')
					blockN = lastBlock.number
				} else {
					blockN = await k.web3.eth.getBlockNumber()
				}
				errCnt = 0
				const blockTsMs = new BigNumber(lastBlock.timestamp)
					.multipliedBy(1000)
					.plus((blockN - lastBlock.number) * expectedBlockMs)
				const delayMs = nowMS() - blockTsMs.toNumber()
				setConnected(delayMs <= maxBlockDelayMs)
				if (delayMs > maxBlockDelayMs) {
					const delayTxt = secondsToDurationString(delayMs/1000)
					setConnectErr(`Out of sync. Last block: ${delayTxt} ago...`)
				}
			} catch (e) {
				errCnt += 1
				if (errCnt >= 2) {
					setConnected(false)
					setConnectErr(`Unable to establish connection: ${e}`)
				}
			}
		}, expectedBlockMs)
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
	const netName = networkName(CFG().chainId)
	const tooltipTitle = <div>Network: {networkURL}{connected ? <></> : <><br />{connectErr}</>}</div>
	return (
		<>
			{openNetworkURL &&
			<ChangeNetworkURL
				networkURL={networkURL}
				onClose={handleCloseNetworkURL}
				/>}
			<Tooltip title={tooltipTitle}>
				<Button
					endIcon={connected ?
						<Wifi className={classes.connected} /> :
						<WifiOff className={classes.disconnected} />}
					onClick={handleOpenNetworkURL}
					>{netName}</Button>
			</Tooltip>
		</>
	)
}
export default NetworkIndicator

const ChangeNetworkURL = (props: {
	networkURL: string
	onClose: (v: string) => void
}) => {
	const [networkURL, setNetworkURL] = React.useState(props.networkURL)
	const [isTesting, setIsTesting] = React.useState(false)
	const onClose = props.onClose
	React.useEffect(() => {
		if (!isTesting) {
			return
		}
		const kit = newKitWithTimeout(networkURL)
		kit.web3.eth
			.getChainId()
			.then((chainId) => {
				const cfgChainId = CFG().chainId
				if (chainId.toString() !== cfgChainId) {
					throw new UserError(`ChainId doesn't match. Expected: ${cfgChainId}, Got: ${chainId}.`)
				} else {
					onClose(networkURL)
				}
			})
			.catch((e) => {
				setIsTesting(false)
				if (!(e instanceof UserError)) {
					throw new Error(`Unable to establish connection with ${networkURL}: ${e}`)
				}
				throw e
			})
			.finally(() => {
				kit.stop()
			})
	}, [onClose, isTesting, networkURL])
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