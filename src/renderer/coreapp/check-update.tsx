import * as React from 'react'
import { ipcRenderer, remote } from 'electron'

import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import GetAppIcon from '@material-ui/icons/GetApp'
import Tooltip from '@material-ui/core/Tooltip'

let _version: string
const version = () => {
	if (!_version) {
		_version = remote.app.getVersion()
	}
	return _version
}

const CheckUpdate = (): JSX.Element => {
	const [newVersion, setNewVersion] = React.useState("")
	React.useEffect(() => {
		const timer = setInterval(() => {
			const updateReady: string | undefined = ipcRenderer.sendSync("check-update-ready")
			console.info(`autoupdater[renderer]: `, updateReady)
			if (updateReady) {
				setNewVersion(updateReady)
			}
		}, 30*1000) // Check it often, why not.

		return () => { clearInterval(timer) }
	})

	const canUpdate = newVersion !== ""
	const handleClick = () => {
		if (!canUpdate) {
			return
		}
		ipcRenderer.sendSync("quit-and-install")
	}
	const tooltipText =
		canUpdate ? "Click to install new version" : "Automatically checking for updates..."
	const buttonText =
		canUpdate ? `v${version()} -> v${newVersion}` : `v${version()}`
	return (
		<Box
			display="flex"
			flexDirection="column">
			<Tooltip title={tooltipText}>
				<Box>
						<Button
							style={{textTransform: "none"}}
							startIcon={<GetAppIcon />}
							color={canUpdate ? "secondary" : "default"}
							disabled={!canUpdate}
							onClick={handleClick}
							>{buttonText}</Button>
				</Box>
			</Tooltip>
		</Box>
	)
}
export default CheckUpdate
