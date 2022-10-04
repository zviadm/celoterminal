import { coreErc20s, coreErc20Decimals } from "../../../lib/erc20/core";
import { moolaToken } from "../moola/moola-helper";

export const MOO: moolaToken = {
	name: "Moola",
	symbol: "MOO",
	decimals: coreErc20Decimals,
	addresses: {
		mainnet: "0x17700282592D6917F6A73D0bF8AcCf4D578c131e",
		alfajores: "0x17700282592D6917F6A73D0bF8AcCf4D578c131e",
	},
};

// NOTE: need to make copy of coreErc20 objects since some of the token internal properties get
// modified within moola codebase.
export const moolaSecLendTokens: moolaToken[] = [
	...coreErc20s.map((e) => Object.assign({}, e)),
	MOO,
];
