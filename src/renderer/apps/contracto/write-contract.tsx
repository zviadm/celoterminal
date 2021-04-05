import { AbiItem } from '@celo/connect'
import BigNumber from 'bignumber.js'

import * as React from 'react'
import {
	Box, Accordion, AccordionSummary, AccordionDetails
} from '@material-ui/core'

import ContractCallInputs from './contract-call-inputs'

const WriteContract = (props: {
	contractAddress: string,
	abi: AbiItem,
	onExecute: (contractAddress: string, abi: AbiItem, inputs: string[], value?: BigNumber) => void
}): JSX.Element => {
	const handleExecute = (inputs: string[], value?: BigNumber) => {
		props.onExecute(props.contractAddress, props.abi, inputs, value)
	}
	return (
		<Accordion>
			<AccordionSummary>{props.abi.name}</AccordionSummary>
			<AccordionDetails>
				<Box flex={1} display="flex" flexDirection="column">
					<ContractCallInputs
						abi={props.abi}
						actionLabel="Execute"
						onAction={handleExecute}
					/>
				</Box>
			</AccordionDetails>
		</Accordion>
	)
}
export default WriteContract