import BigNumber from 'bignumber.js'
import { newKit } from '@celo/contractkit'

import kit, { useNetworkURL } from '../state/kit'
import { CFG, networkName } from '../../lib/cfg'
import { UserError } from '../../lib/error'

import * as React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import WifiIcon from '@material-ui/icons/Wifi'
import WifiOffIcon from '@material-ui/icons/WifiOff'
import Tooltip from '@material-ui/core/Tooltip'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import TextField from '@material-ui/core/TextField'
import LinearProgress from '@material-ui/core/LinearProgress'
import { BlockHeader } from '@celo/connect'

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
	const expectedBlockMs = 5000
	const blockRefetchMs = 600000
	React.useEffect(() => {
		let errCnt = 0
		let lastBlock: BlockHeader
		const maxBlockDelayMs = 3 * expectedBlockMs
		const timer = setInterval(async () => {
			const k = kit()
			try {
				let blockN: number
				if (!lastBlock ||
					new BigNumber(lastBlock.timestamp)
					.multipliedBy(1000)
					.plus(blockRefetchMs)
					.gt(Date.now())) {
					lastBlock = await k.web3.eth.getBlock('latest')
					blockN = lastBlock.number
				} else {
					blockN = await k.web3.eth.getBlockNumber()
				}
				errCnt = 0
				const blockTsMs = new BigNumber(lastBlock.timestamp)
					.multipliedBy(1000)
					.plus((blockN - lastBlock.number) * expectedBlockMs)
				const delayMs = Date.now() - blockTsMs.toNumber()
				setConnected(delayMs <= maxBlockDelayMs)
			} catch (e) {
				errCnt += 1
				if (errCnt >= 2) {
					setConnected(false)
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
	const netName = networkName(CFG().networkId)
	const tooltipTitle = `Network: ${networkURL}`
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
						<WifiIcon className={classes.connected} /> :
						<WifiOffIcon className={classes.disconnected} />}
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
		const kit = newKit(networkURL)
		kit.web3.eth.net
			.getId()
			.then((networkId) => {
				const cfgNetworkId = CFG().networkId
				if (networkId.toString() !== cfgNetworkId) {
					throw new UserError(`NetworkId doesn't match. Expected: ${cfgNetworkId}, Got: ${networkId}.`)
				} else {
					onClose(networkURL)
				}
			})
			.catch((e) => {
				setIsTesting(false)
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