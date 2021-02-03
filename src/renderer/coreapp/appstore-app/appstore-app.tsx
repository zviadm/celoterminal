import * as React from 'react'
import Box from '@material-ui/core/Box'

import AppHeader from '../../components/app-header'

const AppStoreApp = (props: {
	onError: (e: Error) => void,
}): JSX.Element => {

	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader title={"More Apps"} />

		</Box>
	)
}
export default AppStoreApp