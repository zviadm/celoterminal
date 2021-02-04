import * as React from 'react'
import Box from '@material-ui/core/Box'

import AppHeader from '../../components/app-header'

import { Account } from '../../../lib/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CelovoteApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	onError: (e: Error) => void,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column" flex={1}>
			<AppHeader title={"Celovote"} />
		</Box>
	)
}
export default CelovoteApp