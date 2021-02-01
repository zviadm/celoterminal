import * as React from 'react'
import { remote } from 'electron'

import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import GetAppIcon from '@material-ui/icons/GetApp'
import LinearProgress from '@material-ui/core/LinearProgress'
import Tooltip from '@material-ui/core/Tooltip'

let _version: string
const version = () => {
	if (!_version) {
		_version = remote.app.getVersion()
	}
	return _version
}

const CheckUpdate = (props: {

}): JSX.Element => {
	const [isChecking, setIsChecking] = React.useState(false)
	const handleClick = () => { setIsChecking((isChecking) => !isChecking) }
	return (
		<Box
			display="flex"
			flexDirection="column">
			<Box>
				<Tooltip title="Check and install updates">
					<Button
						style={{textTransform: "none"}}
						startIcon={<GetAppIcon />}
						onClick={handleClick}
						>v{version()}</Button>
				</Tooltip>
			</Box>
			<LinearProgress style={{visibility: isChecking ? undefined : "hidden"}} />
		</Box>
	)
}
export default CheckUpdate
