import { ContractKit } from '@celo/contractkit'
import { AbiItem } from '@celo/connect'

import useOnChainState from '../../state/onchain-state'

import * as React from 'react'
import {
	Box, Table, TableBody,
	TableCell, TableRow, LinearProgress, Accordion, AccordionSummary, AccordionDetails, Typography
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import ContractCallInputs from './contract-call-inputs'

const ReadContract = (props: {
	contractAddress: string,
	abi: AbiItem,
}): JSX.Element => {
	const [expanded, setExpanded] = React.useState(false)
	const queryInput = React.useRef<string[]>([])

	const contractAddress = props.contractAddress
	const abi = props.abi
	const {
		fetched,
		fetchError,
		isFetching,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const contract = new kit.web3.eth.Contract([abi], contractAddress)
			const result = await contract.methods[abi.name || ""](...queryInput.current).call()
			return {result}
		},
		[contractAddress, abi, queryInput],
	), {noErrorPropagation: true, lazyFetch: true})
	const handleQuery = (inputs: string[]) => {
		queryInput.current = inputs
		refetch()
	}
	const canQuery = !isFetching
	return (
		<Accordion
			expanded={expanded}
			onChange={(event, expanded) => {
				setExpanded(expanded)
				if (expanded && props.abi.inputs?.length === 0) {
					refetch()
				}
			}}
		>
			<AccordionSummary>{props.abi.name}</AccordionSummary>
			<AccordionDetails>
				<Box flex={1} display="flex" flexDirection="column">
					{props.abi.inputs?.length !== 0 &&
					<ContractCallInputs
						abi={props.abi}
						actionLabel="Query"
						disabled={!canQuery}
						onAction={handleQuery}
					/>}
					{isFetching && <LinearProgress />}
					{fetched &&
					<Table size="small">
						<TableBody>
							{
								props.abi.outputs?.map((o, idx) => {
									return (
										<TableRow key={idx}>
											<TableCell>
												<Typography style={{fontFamily: "monospace"}}>
													{o.name || "<output>"}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography style={{fontFamily: "monospace"}} color="textSecondary">
													{o.type}
												</Typography>
											</TableCell>
											<TableCell width="100%">
												<Typography style={{fontFamily: "monospace", overflow: "wrap", overflowWrap: "anywhere"}}>
													{`${props.abi.outputs?.length === 1 ? fetched.result : fetched.result[idx]}`}
												</Typography>
											</TableCell>
										</TableRow>
									)
								})
							}
						</TableBody>
					</Table>}
					{fetchError &&
					<Alert severity="error">{`${fetchError}`}</Alert>}
				</Box>
			</AccordionDetails>
		</Accordion>
	)
}
export default ReadContract