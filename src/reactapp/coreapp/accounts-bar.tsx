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

import { Account } from '../state/accounts'
import { fmtAddress } from '../../common/utils'
import kit from './tx-runner/kit'
import { CFG, networkName } from '../../common/cfg'
import Tooltip from '@material-ui/core/Tooltip'


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

	const cfg = CFG()
	return (
		<Box display="flex" flexDirection="row" justifyContent="flex-end" p={2}>
			<Box display="flex" flexDirection="row" flex={1}>
				<Tooltip title={cfg.defaultNetworkURL}>
					<Box display="flex" flexDirection="row"  alignItems="center">
						<Typography>{networkName(cfg.networkId)}</Typography>
						<Box marginLeft={1}>
							{connected ? <WifiIcon className={classes.connected} /> : <WifiOffIcon className={classes.disconnected} />}
						</Box>
					</Box>
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

export default AccountsBar