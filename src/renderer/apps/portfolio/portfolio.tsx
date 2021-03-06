import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'

import { Account } from '../../../lib/accounts/accounts'
import useOnChainState from '../../state/onchain-state'
import { fmtAmount } from '../../../lib/utils'
import { TXFunc, TXFinishFunc } from '../../components/app-definition'
import { useErc20List } from '../../state/erc20list-state'
import { Portfolio } from './def'
import { fetchBalancesForAccounts, fetchLockedBalanceForAccounts, totalBalances } from './balances'
import useLocalStorageState from '../../state/localstorage-state'
import { coreErc20Decimals, RegisteredErc20 } from '../../../lib/erc20/core'
import { registeredErc20ConversionRates } from '../../../lib/erc20/conversions'

import * as React from 'react'
import {
	Table, TableHead, TableRow, TableCell, TableBody, FormControlLabel, Switch,
	Button, IconButton, Tooltip,
} from '@material-ui/core'
import { Add, VisibilityOff } from '@material-ui/icons'

import AppHeader from '../../components/app-header'
import AppContainer from '../../components/app-container'
import AppSection from '../../components/app-section'
import AddErc20 from '../../components/add-erc20'
import RemoveErc20 from '../../components/remove-erc20'

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
			const locked = fetchLockedBalanceForAccounts(kit, accounts)
			const conversionRates = registeredErc20ConversionRates(kit, "cUSD", erc20s)
			return {
				balances: await balances,
				locked: await locked,
				conversionRates: await conversionRates,
			}
		},
		[accounts, erc20s]
	))
	const [showTotals, setShowTotals] = useLocalStorageState("terminal/portfolio/show-totals", true)
	const [showAddToken, setShowAddToken] = React.useState(false)
	const [toRemove, setToRemove] = React.useState<RegisteredErc20 | undefined>()

	const cancelAddRemove = () => {
		setShowAddToken(false)
		setToRemove(undefined)
	}
	const onAddRemove = () => {
		erc20List.reload()
		cancelAddRemove()
	}

	const balances = fetched && (
		showTotals ?
			totalBalances(fetched.balances) :
			fetched.balances.get(props.selectedAccount.address)
	)
	const lockedBalance = (fetched && (
		showTotals ?
			BigNumber.sum(...Array.from(fetched.locked.values())) :
			fetched.locked.get(props.selectedAccount.address)
	)) || new BigNumber(0)
	const lockedValue = lockedBalance.shiftedBy(-coreErc20Decimals).multipliedBy(fetched?.conversionRates.get("CELO") || 0)
	const totalValue = fetched && balances && (
		BigNumber.sum(
			...erc20s.map((erc20) => {
				const balance = balances.get(erc20.address || erc20.symbol) || 0
				const price = fetched.conversionRates.get(erc20.address || erc20.symbol)
				const value = price && price.multipliedBy(balance).shiftedBy(-erc20.decimals)
				return value || 0
			}),
			lockedValue,
		)
	)
	return (
		<AppContainer>
			<AppHeader app={Portfolio} isFetching={isFetching} refetch={refetch} />
			{showAddToken && <AddErc20 onCancel={cancelAddRemove} onAdd={onAddRemove} />}
			{toRemove && <RemoveErc20 toRemove={toRemove} onCancel={cancelAddRemove} onRemove={onAddRemove} />}
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
							<TableCell width="100%">Asset</TableCell>
							<TableCell></TableCell>
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
							const isCELO = erc20.symbol === "CELO" && !erc20.address
							return (
								<TableRow key={erc20.address || erc20.symbol}>
									<TableCell>
										{erc20.name}
										{isCELO && <><br />Celo Locked</>}
									</TableCell>
									<TableCell align="right" padding="none">
										{erc20.address &&
										<Tooltip title="Hide token">
											<IconButton
												size="small"
												onClick={() => { setToRemove(erc20) }}
											><VisibilityOff /></IconButton>
										</Tooltip>}
									</TableCell>
									<TableCell align="right" style={{whiteSpace: "nowrap"}}>
										{fmtAmount(balance, erc20.decimals)} {erc20.symbol}
										{isCELO && <><br />{fmtAmount(lockedBalance, erc20.decimals)} {erc20.symbol}</>}
									</TableCell>
									<TableCell align="right">{price ? "$"+price.toFixed(2) : "-"}</TableCell>
									<TableCell align="right" style={{fontWeight: "bold"}}>
										{value ? "$" + fmtAmount(value, 0, 2) : "-"}
										{isCELO && <><br />${fmtAmount(lockedValue, 0, 2)}</>}
									</TableCell>
								</TableRow>
							)
						})
						}
						<TableRow>
							<TableCell colSpan={4} align="right">Total</TableCell>
							<TableCell align="right" style={{fontWeight: "bold"}}>
								{totalValue ? "$" + fmtAmount(totalValue, 0 ,2) : "-"}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</AppSection>
			<AppSection>
				<Button
					color="primary"
					variant="outlined"
					startIcon={<Add />}
					onClick={() => { setShowAddToken(true) }}
					>Add Token</Button>
			</AppSection>
		</AppContainer>
	)
}
export default PortfolioApp
