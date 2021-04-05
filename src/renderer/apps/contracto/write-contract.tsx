import { AbiItem } from '@celo/connect'

import * as React from 'react'
import {
	Box, Accordion, AccordionSummary, AccordionDetails
} from '@material-ui/core'

import ContractCallInputs from './contract-call-inputs'

const WriteContract = (props: {
	contractAddress: string,
	abi: AbiItem,
	onExecute: (contractAddress: string, abi: AbiItem, inputs: string[]) => void
}): JSX.Element => {
	const handleExecute = (inputs: string[]) => {
		props.onExecute(props.contractAddress, props.abi, inputs)
	}
	return (
		<Accordion>
			<AccordionSummary>{props.abi.name}</AccordionSummary>
			<AccordionDetails>
				<Box flex={1} display="flex" flexDirection="column">
					{props.abi.inputs?.length !== 0 &&
					<ContractCallInputs
						abi={props.abi}
						actionLabel="Execute"
						onAction={handleExecute}
					/>}
				</Box>
			</AccordionDetails>
		</Accordion>
	)
}
export default WriteContract