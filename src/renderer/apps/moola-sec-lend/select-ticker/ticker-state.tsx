import * as log from "electron-log";
import * as React from "react";
import { CFG, selectAddressOrThrow } from "../../../../lib/cfg";
import { DEFAULT_TICKER_SYMBOL_LIST, moolaSecLendTickers } from "../config";
import { moolaSecLendTicker } from "../moola-sec-lend-helper";

const cmpMoolaTickers = (
	a: moolaSecLendTicker,
	b: moolaSecLendTicker
): number => {
	// always put CUSD and CEUR in front
	if (a.symbol === "CUSD") {
		return -1;
	} else if (b.symbol === "CUSD") {
		return 1;
	} else if (a.symbol === "CEUR") {
		return -1;
	} else if (b.symbol === "CEUR") {
		return 1;
	}

	const isLowerA = a.symbol[0] === a.symbol[0].toLowerCase();
	const isLowerB = b.symbol[0] === b.symbol[0].toLowerCase();

	return isLowerA && !isLowerB
		? -1
		: !isLowerA && isLowerB
		? 1
		: a.symbol < b.symbol
		? -1
		: 1;
};

export const useTickerList = (): {
	tickers: moolaSecLendTicker[];
	reload: () => void;
} => {
	const [changeN, setChangeN] = React.useState(0);
	const tickers = React.useMemo(() => {
		const registered = registeredList()
			.map((r) =>
				moolaSecLendTickers.find(
					(f) => selectAddressOrThrow(f.addresses) === r.address
				)
			)
			.filter((v) => v !== undefined) as moolaSecLendTicker[];

		const sorted = registered.sort(cmpMoolaTickers);

		return sorted;
	}, [changeN]);
	const reload = () => {
		setChangeN((n) => n + 1);
	};
	return {
		tickers,
		reload,
	};
};

export const setUpDefaultList = () => {
	const symbolSet = new Set(DEFAULT_TICKER_SYMBOL_LIST);
	const tickers = moolaSecLendTickers.filter((r) => symbolSet.has(r.symbol));
	const list = tickers.map((t) => ({
		address: selectAddressOrThrow(t.addresses),
	}));

	setRegisteredList(list);
};

export const addTickerToList = (symbol: string): moolaSecLendTicker => {
	const ticker = moolaSecLendTickers.find((r) => r.symbol === symbol);
	if (!ticker) {
		throw new Error(`Ticker: ${symbol} not found in registry.`);
	}
	const tickerAddress = selectAddressOrThrow(ticker.addresses);
	const list = registeredList();
	const match = list.find(
		(l) => l.address.toLowerCase() === tickerAddress.toLowerCase()
	);
	if (match) {
		return ticker;
	}
	// Remove, in-case this erc20 address was somehow added in to the customList before.
	removeTickerFromList(tickerAddress);
	list.push({ address: tickerAddress });
	setRegisteredList(list);

	return ticker;
};

const registeredListKeyPrefix = "terminal/moola-sec-lend/registered-list/";

const registeredList = (): { address: string }[] => {
	const registeredListKey = registeredListKeyPrefix + CFG().chainId;
	const json = localStorage.getItem(registeredListKey);
	if (!json) {
		return [];
	}
	try {
		return JSON.parse(json);
	} catch (e) {
		log.error(`MoolaSecLend: failed to parse: ${registeredListKey} - ${json}`);
		return [];
	}
};

export const removeTickerFromList = (address: string): void => {
	const rList = registeredList();
	const rListFiltered = rList.filter((r) => r.address !== address);
	if (rListFiltered.length !== rList.length) {
		setRegisteredList(rListFiltered);
	}
};

const setRegisteredList = (list: { address: string }[]) => {
	const registeredListKey = registeredListKeyPrefix + CFG().chainId;
	localStorage.setItem(registeredListKey, JSON.stringify(list));
};
