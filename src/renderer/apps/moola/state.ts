import { ContractKit, StableToken } from '@celo/contractkit'
// import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
// import BigNumber from 'bignumber.js'
import { BlockTransactionString } from 'web3-eth'
import { coreErc20s, coreErc20Decimals, RegisteredErc20 } from '../../../lib/erc20/core'

import useOnChainState from '../../state/onchain-state'
import { Account } from '../../../lib/accounts/accounts'

import * as React from 'react'
import useEventHistoryState, { estimateTimestamp } from '../../state/event-history-state'
import { AbiItem } from '@celo/connect'
import { abi as LendingPoolAddressesProviderABI } from '@aave/protocol-v2/artifacts/contracts/interfaces/ILendingPoolAddressesProvider.sol/ILendingPoolAddressesProvider.json';
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useUserOnChainState = (account: Account, token: string) => {
	return useOnChainState(React.useCallback(
		async (kit: ContractKit) => {

			const goldToken = await kit.contracts.getGoldToken()
			const LendingPoolAddressesProvider = new kit.web3.eth.Contract(LendingPoolAddressesProviderABI as AbiItem[], '0xb3072f5F0d5e8B9036aEC29F37baB70E86EA0018')
			const lendingPoolAddress = await LendingPoolAddressesProvider.methods.getLendingPool().call();
			return {
				goldToken,
				lendingPoolAddress,
			}
		},
		[account, token]
	), {
		// Faster constant refetch to continue updating the exchange rate.
		autoRefetchSecs: 20,
	})
}
