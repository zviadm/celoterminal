import { alfajoresChainId } from "../../../lib/cfg";

export const MOOLA_SEC_LEND_AVAILABLE_CHAIN_IDS = [alfajoresChainId];

export interface moolaSecLendTicker {
	readonly name: string;
	readonly symbol: string;
	readonly decimals: number;
	readonly addresses: {
		mainnet?: string;
		baklava?: string;
		alfajores: string;
	};
	address?: string;
}

export const lendingPoolDataProviderAddresses = {
	alfajores: "0x46c4E7570Fbdc525C58bb1c935f86DbC06da1329",
};

export const lendingPoolAddressesProviderAddresses = {
	alfajores: "0x71b18885D0f14C1604DC583a1bDa8E66d17b2386",
};
