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
