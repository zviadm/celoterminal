import BigNumber from 'bignumber.js'
import { Address, CeloTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'

interface IErc20 {
	address: Address
	balanceOf (account: string): Promise<BigNumber>
	allowance: (accountOwner: string, spender: string) => Promise<BigNumber>
	increaseAllowance: (address: string, amount: BigNumber.Value) => CeloTransactionObject<boolean>
}

type tokenF = (kit: ContractKit) => Promise<IErc20>

export const StableTokens: {[token: string]: tokenF} = {
	"cUSD": (kit: ContractKit) => (kit.contracts.getStableToken()),
}
