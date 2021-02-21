import { Box, Paper } from '@material-ui/core'
import * as React from 'react'

const AppSection = (props: {
	children: React.ReactNode | React.ReactNode[],
}): JSX.Element => {
	return (
		<Box marginTop={2}>
			<Paper>
				<Box p={2} display="flex" flexDirection="column">
					{props.children}
				</Box>
			</Paper>
		</Box>
	)
}
export default AppSection