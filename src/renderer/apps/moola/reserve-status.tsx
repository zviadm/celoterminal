import * as React from 'react'
import { Box, LinearProgress, Table, TableBody, TableHead, TableRow, TableCell  } from '@material-ui/core'
import SectionTitle from '../../components/section-title'
import { userReserveData } from './moola-helper'

const ReserveStatus = (
	props: {
		tokenName: string,
		isFetching: boolean,
		userReserveData: userReserveData,
	}
): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<SectionTitle>{props.tokenName} Account Status</SectionTitle>
			{props.isFetching ? <LinearProgress /> : <Table size="small">
				<TableHead>
					<TableRow>
						<TableCell>Field</TableCell>
						<TableCell>Value</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{Object.keys(props.userReserveData || {}).map((key) => (<TableRow>
							<TableCell>{key}</TableCell>
							<TableCell>{props.userReserveData[key as keyof typeof props.userReserveData]}</TableCell>
						</TableRow>)
					)}
				</TableBody>
			</Table>}
		</Box>
	)
}
export default ReserveStatus