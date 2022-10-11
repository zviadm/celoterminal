import { coreErc20s, coreErc20Decimals } from "../../../lib/erc20/core";
import { moolaSecLendToken } from "./moola-sec-lend-helper";

export const CUSD: moolaSecLendToken = {
	name: "Celo Dollar",
	symbol: "CUSD",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x6ca8C729475a8565C2Ec5A76116ffB668EFFcDAA",
	},
};

export const CEUR: moolaSecLendToken = {
	name: "Celo Euro",
	symbol: "CEUR",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xe64a13883988950e4FE35f60fe342dc63E6bf701",
	},
};

export const AAPL: moolaSecLendToken = {
	name: "Apple Inc",
	symbol: "AAPL",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x68ce45F885514eDF61C9691de9F4C91529a8D081",
	},
};

export const TSLA: moolaSecLendToken = {
	name: "Tesla Inc",
	symbol: "TSLA",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x93Ed9c790587212099f5B2F5D48c07A9b10B9e3A",
	},
};

export const IBM: moolaSecLendToken = {
	name: "IBM Common Stock",
	symbol: "IBM",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x03d0cF58cE495715f519028C3b5A00491a9FFe46",
	},
};

export const AMZN: moolaSecLendToken = {
	name: "Amazon.com, Inc.",
	symbol: "AMZN",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xD9912859cBEaC4C10d68AC4Cbc0338c078F15c81",
	},
};

export const GOOG: moolaSecLendToken = {
	name: "Alphabet Inc",
	symbol: "GOOG",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x08e9826B97851b995aB03CB17830EA49e715e17B",
	},
};

export const COST: moolaSecLendToken = {
	name: "Costco Wholesale Corporation",
	symbol: "COST",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xf747747c78BE37Af896364ac083988e4a5E24cd5",
	},
};

export const DIS: moolaSecLendToken = {
	name: "Walt Disney Co",
	symbol: "DIS",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x236caeA2C28714Fc85E8B021A657eF33a67BcC8B",
	},
};

export const FB: moolaSecLendToken = {
	name: "Facebook Inc",
	symbol: "FB",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x7657CCAC3F92Bd5C272dB564d264288159f75912",
	},
};

export const MA: moolaSecLendToken = {
	name: "Mastercard Inc",
	symbol: "MA",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xd30cd9B5c7c2d1bf50DAAB2a02759ABc744d328D",
	},
};

export const MSFT: moolaSecLendToken = {
	name: "Microsoft Corporation",
	symbol: "MSFT",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xa1bAa726F03190395afd5a797dbaf17FCBc35e75",
	},
};

export const NFLX: moolaSecLendToken = {
	name: "Netflix Inc",
	symbol: "NFLX",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x5fEeb47425b400bB92733619e0B714305d84ffD5",
	},
};

export const NKE: moolaSecLendToken = {
	name: "Nike Inc",
	symbol: "NKE",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x03B1B5CCfC6300aDc2D516E17eFd0db05549190D",
	},
};

export const PINS: moolaSecLendToken = {
	name: "Pinterest Inc",
	symbol: "PINS",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x739b736AF91bc7a0F0aC8C853087b237643f4fc9",
	},
};

export const SHOP: moolaSecLendToken = {
	name: "Shopify Inc",
	symbol: "SHOP",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x5646aF821aFaDdaEF8B96fDa7E0309CD757e148f",
	},
};

export const SPOT: moolaSecLendToken = {
	name: "Spotify Technology SA",
	symbol: "SPOT",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x625BC1978390fda44d989988941f72721eC80AE6",
	},
};

export const DEFAULT_TOKEN = CUSD;
export const DEFAULT_TICKER_SYMBOL_LIST = [
	"CUSD",
	"AAPL",
	"TSLA",
	"IBM",
	"AMZN",
];

// NOTE: need to make copy of coreErc20 objects since some of the token internal properties get
// modified within moola codebase.
export const moolaSecLendTokens: moolaSecLendToken[] = [
	CUSD,
	CEUR,
	AAPL,
	TSLA,
	IBM,
	AMZN,
	GOOG,
	COST,
	DIS,
	FB,
	MA,
	MSFT,
	NFLX,
	NKE,
	PINS,
	SHOP,
	SPOT,
];
