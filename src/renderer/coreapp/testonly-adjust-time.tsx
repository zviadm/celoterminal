import { testOnlyAdjustNow, testOnlyAdjustedMS } from '../state/time'

import * as React from 'react'
import {
	Button, Dialog, DialogContent,
} from '@material-ui/core'
import NumberInput from '../components/number-input'

const TestOnlyAdjustTime = (): JSX.Element => {
	const [openAdjustTime, setOpenAdjustTime] = React.useState(false)
	const [adjustTimeMS, setAdjustTimeMS] = React.useState(testOnlyAdjustedMS())

	const handleOpenAdjustTime = () => { setOpenAdjustTime(true) }
	const handleCloseAdjustTime = () => {
		testOnlyAdjustNow(adjustTimeMS)
		setOpenAdjustTime(false)
	}
	return (
		<>
		<Dialog open={openAdjustTime} onClose={handleCloseAdjustTime}>
			<DialogContent style={{minWidth: 500}}>
				<NumberInput
					id="adjust-time-ms-input"
					margin="dense"
					onChangeValue={(v) => setAdjustTimeMS(Number.parseFloat(v))}
					placeholder="0.0"
					value={adjustTimeMS}
				/>
			</DialogContent>
		</Dialog>
		<Button
			id="adjust-time-open"
			onClick={handleOpenAdjustTime}
		>ADJUST TIME</Button>
		</>
	)
}
export default TestOnlyAdjustTime
