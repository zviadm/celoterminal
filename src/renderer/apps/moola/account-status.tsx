import * as React from 'react'
import { Box, LinearProgress, Table, TableBody, TableRow, TableCell  } from '@material-ui/core'
import SectionTitle from '../../components/section-title'
import { userAccountData } from './moola-helper'

const AccountStatus = (
	props: {
		isFetching: boolean,
		userAccountData: userAccountData,
	}
): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<SectionTitle>Account Status</SectionTitle>
			{props.isFetching ? <LinearProgress /> : <Table size="small">
				<TableBody>
					{Object.keys(props.userAccountData || {}).map((key) => (<TableRow>
							<TableCell>{key}</TableCell>
							<TableCell>{props.userAccountData[key as keyof typeof props.userAccountData]}</TableCell>
						</TableRow>)
					)}
				</TableBody>
			</Table>}
		</Box>
	)
}
export default AccountStatus