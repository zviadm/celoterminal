import { Box } from '@material-ui/core'
import * as React from 'react'

const AppContainer = (props: {
	children: React.ReactNode | React.ReactNode[],
}): JSX.Element => {
	return <Box display="flex" flexDirection="column" flex={1}>{props.children}</Box>
}
export default AppContainer