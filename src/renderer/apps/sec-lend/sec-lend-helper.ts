export interface SecLendTicker {
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
