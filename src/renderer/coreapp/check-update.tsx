import { ipcRenderer } from 'electron'
import remote from '@electron/remote'
import log from 'electron-log'

import * as React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import LinearProgress from '@material-ui/core/LinearProgress'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'

import useLocalStorageState from '../state/localstorage-state'
import Typography from '@material-ui/core/Typography'
import { runWithInterval } from '../../lib/interval'

let _version: string
const version = () => {
	if (!_version) {
		_version = remote.app.getVersion()
	}
	return _version
}

const useStyles = makeStyles(() => ({
	versionButton: {
		textTransform: "none",
	},
	checkbox: {
		padding: 0,
		paddingLeft: 5,
	},
}))

const CheckUpdate = (): JSX.Element => {
	const classes = useStyles()
	const [beta, setBeta] = useLocalStorageState<boolean>("terminal/core/update-beta", false)
	const [newVersion, setNewVersion] = React.useState("")
	const [isUpdating, setIsUpdating] = React.useState(false)
	React.useEffect(() => {
		const cancel = runWithInterval(
			"coreapp-update",
			async () => {
				const updateReady: string | undefined = ipcRenderer.sendSync("check-update-ready")
				if (updateReady) {
					log.info(`autoupdater[renderer]: `, updateReady)
					setNewVersion(updateReady)
				}
			},
			30*1000) // Check it often, why not.
		return cancel
	}, [])
	React.useEffect(() => {
		ipcRenderer.sendSync("set-allow-prerelease", beta)
	}, [beta])

	const canUpdate = newVersion !== "" && !isUpdating
	const handleClick = () => {
		if (!canUpdate) {
			return
		}
		setIsUpdating(true)
		ipcRenderer.send("quit-and-install")
	}
	const tooltipText =
		newVersion !== "" ? "Click to install new version" : "Terminal automatically checks for updates in the background"
	const buttonText =
		newVersion !== "" ? `v${version()} \u2192 v${newVersion}` : `v${version()}`
	return (
		<Box display="flex" flexDirection="column" alignItems="flex-end">
			<Tooltip title={tooltipText}>
				<Box>
						<Button
							className={classes.versionButton}
							color={canUpdate ? "secondary" : "default"}
							disabled={!canUpdate}
							onClick={handleClick}
							>{buttonText}</Button>
				</Box>
			</Tooltip>
			<Tooltip title="Subscribe to Beta updates">
				<Box marginRight={2}>
					<FormControlLabel
						control={
							<Checkbox
								className={classes.checkbox}
								icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
								checkedIcon={<CheckBoxIcon fontSize="small" />}
								checked={beta}
								onChange={() => { setBeta(!beta) } }
							/>
						}
						label={<Typography variant="caption" color="textSecondary">beta</Typography>}
						labelPlacement="start"
					/>
				</Box>
			</Tooltip>
			{isUpdating &&
			<Box alignSelf="stretch" mx={1}>
				<LinearProgress color="secondary" />
			</Box>}
		</Box>
	)
}
export default CheckUpdate
