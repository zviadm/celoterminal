import * as React from 'react'
import { Box, Button, Select, MenuItem, LinearProgress, Table, TableBody,
	TableHead, TableRow, TableCell, Tooltip  } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import NumberInput from '../../components/number-input'
import BigNumber from 'bignumber.js'
import { coreErc20Decimals, Erc20InfiniteAmount } from '../../../lib/erc20/core'
import { availableRateMode } from './config';
import SectionTitle from '../../components/section-title'

const AccountStatus = (
	props: {
		tokenName: string,
		isFetching: boolean,
		userReserveData: object,
	}
): JSX.Element => {

	const [borrowAmount, setwitBorrowAmount] = React.useState("")
	const [rateMode, setRateMode] = React.useState(1)

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
							<TableCell>{props.userReserveData[key]}</TableCell>
						</TableRow>)
					)}
				</TableBody>
			</Table>}
		</Box>
	)
}
export default AccountStatus