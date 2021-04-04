import { ContractKit } from '@celo/contractkit'
import { isValidAddress } from 'ethereumjs-util'

import { Contracto } from './def'
import { Account } from '../../../lib/accounts/accounts'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import useOnChainState from '../../state/onchain-state'
import useLocalStorageState from '../../state/localstorage-state'

import * as React from 'react'
import {
	Button, Box, Table, TableBody,
	TableCell, TableRow, Tab, TextField, LinearProgress
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import TabContext from '@material-ui/lab/TabContext'
import TabList from '@material-ui/lab/TabList'
import TabPanel from '@material-ui/lab/TabPanel'

import AppHeader from '../../components/app-header'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import { fetchContractAbi } from '../../../lib/tx-parser/contract-abi'

const ContractoApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const [contractAddress, setContractAddress] = useLocalStorageState("terminal/contracto/contract-address", "")
	const [validAddress, setValidAddress] = React.useState("")
	React.useEffect(() => {
		if (isValidAddress(contractAddress)) {
			setValidAddress(contractAddress)
		} else {
			setValidAddress("")
		}
	}, [contractAddress])

	const account = props.selectedAccount
	const {
		fetched,
		isFetching,
		refetch,
		fetchError,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			if (validAddress === "") {
				return {}
			}
			const contractAbi = await fetchContractAbi(kit, validAddress)
			return {contractAbi}
		},
		[validAddress],
	), {noErrorPropagation: true})
	return (
		<AppContainer>
			<AppHeader app={Contracto} isFetching={isFetching} refetch={refetch} />
			<AppSection>
				<TextField
					id="contract-address"
					autoFocus
					label="Contract address"
					InputLabelProps={{shrink: true}}
					placeholder="0x..."
					size="medium"
					fullWidth={true}
					spellCheck={false}
					inputProps={{
						spellCheck: false,
						style: {fontFamily: "monospace"}
					}}
					value={contractAddress}
					onChange={(event) => { setContractAddress(event.target.value) }}
				/>
				<Box display="flex" flexDirection="column" marginTop={1}>
					{isFetching && <LinearProgress />}
					{fetchError &&
					<Alert severity="error">{`${fetchError}`}</Alert>}
				</Box>
			</AppSection>

		</AppContainer>
	)
}
export default ContractoApp