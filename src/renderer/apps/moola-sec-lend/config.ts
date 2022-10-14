import { coreErc20Decimals } from "../../../lib/erc20/core";
import { moolaSecLendTicker } from "./moola-sec-lend-helper";

export const CUSD: moolaSecLendTicker = {
	name: "Celo Dollar",
	symbol: "CUSD",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
	},
};

export const CEUR: moolaSecLendTicker = {
	name: "Celo Euro",
	symbol: "CEUR",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
	},
};

export const AAPL: moolaSecLendTicker = {
	name: "Apple Inc",
	symbol: "AAPL",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xE1f94AF96a22489Afb50e6ec574FDa10F288aa0A",
	},
};

export const TSLA: moolaSecLendTicker = {
	name: "Tesla Inc",
	symbol: "TSLA",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xd1243C0585A49F167a980D266ed452d953D7a4bd",
	},
};

export const IBM: moolaSecLendTicker = {
	name: "IBM Common Stock",
	symbol: "IBM",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xb981E018ce3a06b42D113985EC1D552EAFf15f1C",
	},
};

export const AMZN: moolaSecLendTicker = {
	name: "Amazon.com, Inc.",
	symbol: "AMZN",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x563B9Ce9a2fEDa3875E44216b707a1175BD908D8",
	},
};

export const GOOG: moolaSecLendTicker = {
	name: "Alphabet Inc",
	symbol: "GOOG",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x30E2A875D6E9cd346775aA723fb9DDA2a16025f3",
	},
};

export const COST: moolaSecLendTicker = {
	name: "Costco Wholesale Corporation",
	symbol: "COST",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xd54C41e5078cCdb4A14C5d94c3adf159788d414f",
	},
};

export const DIS: moolaSecLendTicker = {
	name: "Walt Disney Co",
	symbol: "DIS",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x9408e989F9a83456B14389F33c00B29D1e9D616c",
	},
};

export const FB: moolaSecLendTicker = {
	name: "Facebook Inc",
	symbol: "FB",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x259f5FC36aEb08C72E10A63eFd656F716667F8a0",
	},
};

export const MA: moolaSecLendTicker = {
	name: "Mastercard Inc",
	symbol: "MA",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x6Bb29c8f6121ed5535a0F29475702BC2bD282a0d",
	},
};

export const MSFT: moolaSecLendTicker = {
	name: "Microsoft Corporation",
	symbol: "MSFT",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xB9790908C525093E001976b449a4134d3000697E",
	},
};

export const NFLX: moolaSecLendTicker = {
	name: "Netflix Inc",
	symbol: "NFLX",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x190fb53B4cCff1884069731b95A46103892cDc67",
	},
};

export const NKE: moolaSecLendTicker = {
	name: "Nike Inc",
	symbol: "NKE",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0xD6F45A1039Fe6E6c5bdC30b84E35DAECDa4EAbFE",
	},
};

export const PINS: moolaSecLendTicker = {
	name: "Pinterest Inc",
	symbol: "PINS",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x2b6D4881DFcA060F23B47612f1246f65Ea523e56",
	},
};

export const SHOP: moolaSecLendTicker = {
	name: "Shopify Inc",
	symbol: "SHOP",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x808D36c14C796BE6f92196600B8fC12f6Ef394C5",
	},
};

export const SPOT: moolaSecLendTicker = {
	name: "Spotify Technology SA",
	symbol: "SPOT",
	decimals: coreErc20Decimals,
	addresses: {
		alfajores: "0x7A7Cd84ae41a86B7069421Ad02CFf1F6FAd91B57",
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
export const moolaSecLendTickers: moolaSecLendTicker[] = [
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

export const lendingPoolDataProviderAddresses = {
	alfajores: "0x72831079098E2b4726Bf5236f886dbD44A975197",
};

export const lendingPoolAddressesProviderAddresses = {
	alfajores: "0xe752eA2ece5a2E257aF9FE82987d9F878200abA9",
};
