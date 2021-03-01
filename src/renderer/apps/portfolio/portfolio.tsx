import { ContractKit } from '@celo/contractkit'

import { Account } from '../../../lib/accounts'
import useOnChainState from '../../state/onchain-state'
import { fmtAmount } from '../../../lib/utils'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { useErc20List } from '../../state/erc20list-state'
import { Portfolio } from './def'
import { fetchBalancesForAccounts, totalBalances } from './balances'
import useLocalStorageState from '../../state/localstorage-state'

import * as React from 'react'
import {
	Table, TableHead, TableRow, TableCell, TableBody, FormControlLabel, Switch,
} from '@material-ui/core'

import AppHeader from '../../components/app-header'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import { fetchConversionRates } from './conversions'
import BigNumber from 'bignumber.js'

const PortfolioApp = (props: {
	accounts: Account[],
	selectedAccount: Account,
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void,
}): JSX.Element => {
	const accounts = props.accounts
	const erc20List = useErc20List()
	const erc20s = erc20List.erc20s
	const {
		isFetching,
		fetched,
		refetch,
	} = useOnChainState(React.useCallback(
		async (kit: ContractKit) => {
			const balances = fetchBalancesForAccounts(kit, accounts, erc20s)
			const conversionRates = fetchConversionRates(kit, "cUSD", erc20s)
			return {
				balances: await balances,
				conversionRates: await conversionRates,
			}
		},
		[accounts, erc20s]
	))
	const [showTotals, setShowTotals] = useLocalStorageState("terminal/portfolio/show-totals", true)

	const balances = fetched && (
		showTotals ?
			totalBalances(fetched.balances) :
			fetched.balances.get(props.selectedAccount.address)
	)
	const totalValue = fetched && balances && (
		BigNumber.sum(
			...erc20s.map((erc20) => {
				const balance = balances.get(erc20.address || erc20.symbol) || 0
				const price = fetched.conversionRates.get(erc20.address || erc20.symbol)
				const value = price && price.multipliedBy(balance).shiftedBy(-erc20.decimals)
				return value || 0
			})
		)
	)
	return (
		<AppContainer>
			<AppHeader app={Portfolio} isFetching={isFetching} refetch={refetch} />
			<AppSection>
				<FormControlLabel
					control={
						<Switch
							checked={showTotals}
							onChange={(event) => { setShowTotals(event.target.checked) }}
							color="secondary"
						/>
					}
					label="Show Totals"
				/>

				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Asset</TableCell>
							<TableCell align="right">Amount</TableCell>
							<TableCell align="right">Price</TableCell>
							<TableCell align="right">Value</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{fetched && balances &&
						erc20s.map((erc20) => {
							const balance = balances.get(erc20.address || erc20.symbol) || 0
							const price = fetched.conversionRates.get(erc20.address || erc20.symbol)
							const value = price && price.multipliedBy(balance).shiftedBy(-erc20.decimals)
							return (
								<TableRow key={erc20.symbol}>
									<TableCell>{erc20.name}</TableCell>
									<TableCell align="right">{fmtAmount(balance, erc20.decimals)} {erc20.symbol}</TableCell>
									<TableCell align="right">{price ? "$"+price.toFixed(2) : "-"}</TableCell>
									<TableCell align="right" style={{fontWeight: "bold"}}>
										{value ? "$" + fmtAmount(value, 0, 2) : "-"}
									</TableCell>
								</TableRow>
							)
						})
						}
						<TableRow>
							<TableCell colSpan={3} align="right">Total</TableCell>
							<TableCell align="right" style={{fontWeight: "bold"}}>
								{totalValue ? "$" + fmtAmount(totalValue, 0 ,2) : "-"}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</AppSection>
		</AppContainer>
	)
}
export default PortfolioApp
