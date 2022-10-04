import * as React from "react";
import { AbiItem } from "@celo/connect";
import { ContractKit } from "@celo/contractkit";
import useOnChainState from "../../state/onchain-state";
import { Account } from "../../../lib/accounts/accounts";
import { selectAddressOrThrow } from "../../../lib/cfg";

import { abi as LendingPoolAddressesProviderABI } from "../moola/abi/AddressesProvider.json";
import { abi as LendingPoolABI } from "../moola/abi/LendingPool.json";
import { abi as LendingPoolDataProviderABI } from "../moola/abi/DataProvider.json";
import {
	lendingPoolAddressesProviderAddresses,
	lendingPoolDataProviderAddresses,
	formattedUserAccountData,
	formattedReserveData,
	formattedUserReserveData,
} from "../moola/moola-helper";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useUserOnChainState = (account: Account, tokenAddress: string) => {
	return useOnChainState(
		React.useCallback(
			async (kit: ContractKit) => {
				const goldToken = await kit.contracts.getGoldToken();

				const lendingPoolAddressesProviderAddress = selectAddressOrThrow(
					lendingPoolAddressesProviderAddresses
				);
				const LendingPoolAddressesProvider = new kit.web3.eth.Contract(
					LendingPoolAddressesProviderABI as AbiItem[],
					lendingPoolAddressesProviderAddress
				);
				const lendingPoolAddress = await LendingPoolAddressesProvider.methods
					.getLendingPool()
					.call();
				const priceOracleAddress = await LendingPoolAddressesProvider.methods
					.getPriceOracle()
					.call();
				const LendingPool = new kit.web3.eth.Contract(
					LendingPoolABI as AbiItem[],
					lendingPoolAddress
				);
				const lendingPoolDataProviderAddress = selectAddressOrThrow(
					lendingPoolDataProviderAddresses
				);
				const LendingPoolDataProvider = new kit.web3.eth.Contract(
					LendingPoolDataProviderABI as AbiItem[],
					lendingPoolDataProviderAddress
				);

				const userAccountDataRaw = await LendingPool.methods
					.getUserAccountData(account.address)
					.call();
				const userReserveDataRaw = await LendingPoolDataProvider.methods
					.getUserReserveData(tokenAddress, account.address)
					.call();
				const reserveDataRaw = await LendingPoolDataProvider.methods
					.getReserveData(tokenAddress)
					.call();

				return {
					goldToken,
					lendingPoolAddress,
					lendingPoolDataProviderAddress,

					priceOracleAddress,

					reserveData: formattedReserveData(reserveDataRaw),

					userAccountData: formattedUserAccountData(userAccountDataRaw),
					userReserveData: formattedUserReserveData(
						userReserveDataRaw,
						reserveDataRaw
					),
				};
			},
			[account, tokenAddress]
		),
		{}
	);
};
