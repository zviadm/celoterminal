import * as React from 'react'
import { Box, LinearProgress, Table, TableBody, TableRow, TableCell  } from '@material-ui/core'
import SectionTitle from '../../components/section-title'
import { reserveData } from './moola-helper'

const ReserveStatus = (
	props: {
		tokenName: string,
		isFetching: boolean,
		reserveData: reserveData,
	}
): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<SectionTitle>{props.tokenName} Reserve Status</SectionTitle>
			{props.isFetching ? <LinearProgress /> : <Table size="small">
				<TableBody>
					{Object.keys(props.reserveData || {}).map((key) => (<TableRow>
							<TableCell>{key}</TableCell>
							<TableCell>{props.reserveData[key as keyof typeof props.reserveData]}</TableCell>
						</TableRow>)
					)}
				</TableBody>
			</Table>}
		</Box>
	)
}
export default ReserveStatus