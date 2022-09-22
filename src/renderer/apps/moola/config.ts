import { coreErc20s, coreErc20Decimals } from "../../../lib/erc20/core";
import { moolaToken } from "./moola-helper";

export const availableRateMode: {
	readonly stable: number;
	readonly variable: number;
} = {
	stable: 1,
	variable: 2,
};

export const MOO: moolaToken = {
	name: "Moola",
	symbol: "MOO",
	decimals: coreErc20Decimals,
	addresses: {
		mainnet: "0x17700282592D6917F6A73D0bF8AcCf4D578c131e",
		alfajores: "0x17700282592D6917F6A73D0bF8AcCf4D578c131e",
	},
};

export const MOO_GOV: moolaToken = {
	name: "Moola",
	symbol: "MOO",
	decimals: coreErc20Decimals,
	addresses: {
		mainnet: "0x17700282592D6917F6A73D0bF8AcCf4D578c131e",
		alfajores: "0x1B3d91a6f6a7BeB0149Bde9FA08785A741b09028",
	},
};

// NOTE: need to make copy of coreErc20 objects since some of the token internal properties get
// modified within moola codebase.
export const moolaTokens: moolaToken[] = [
	...coreErc20s.map((e) => Object.assign({}, e)),
	MOO,
];
