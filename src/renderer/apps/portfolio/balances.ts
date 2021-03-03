import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'

import Erc20Contract, { newErc20 } from '../../../lib/erc20/erc20-contract'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { Account } from '../../../lib/accounts'
import { LockedGoldWrapper } from '@celo/contractkit/lib/wrappers/LockedGold'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'

export const fetchBalancesForAccounts = async (
	kit: ContractKit,
	accounts: Account[],
	erc20s: RegisteredErc20[]): Promise<Map<string, Map<string, BigNumber>>> => {

	const contracts = await Promise.all(erc20s.map((e) => newErc20(kit, e)))
	const balances = await Promise.all(accounts.map((a) => {
		return fetchBalancesForAccount(a, contracts).then(
			balances => {
				return new Map(erc20s.map((e, idx) => [e.address || e.symbol, balances[idx]]))
			})
	}))
	return new Map(accounts.map((a, idx) => [a.address, balances[idx]]))
}

const fetchBalancesForAccount = async (
	account: Account,
	erc20s: Erc20Contract[],
) => {
	return await Promise.all(erc20s.map((e) => e.balanceOf(account.address)))
}

export const totalBalances = (
	balancesByAccount: Map<string, Map<string, BigNumber>>): Map<string, BigNumber> => {
	const totals = new Map<string, BigNumber>()
	balancesByAccount.forEach((v) => {
		v.forEach((v, a) => {
			totals.set(a, v.plus(totals.get(a) || 0))
		})
	})
	return totals
}

export const fetchLockedBalanceForAccounts = async (
	kit: ContractKit,
	accounts: Account[],
): Promise<Map<string, BigNumber>> => {
	const accountsC = await kit.contracts.getAccounts()
	const lockedGold = await kit.contracts.getLockedGold()
	const balances = await Promise.all(
		accounts.map((a) => fetchLockedBalanceForAccount(accountsC, lockedGold, a)))
	return new Map(balances.map((v, idx) => [accounts[idx].address, v]))
}

const fetchLockedBalanceForAccount = async (
	accounts: AccountsWrapper,
	lockedGold: LockedGoldWrapper,
	account: Account,
) => {
	if (!await accounts.isAccount(account.address)) {
		return new BigNumber(0)
	}
	const locked = lockedGold.getAccountTotalLockedGold(account.address)
	const pending = lockedGold.getPendingWithdrawalsTotalValue(account.address)
	return (await locked).plus(await pending)
}