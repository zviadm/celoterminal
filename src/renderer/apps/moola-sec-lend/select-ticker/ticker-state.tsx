import * as log from "electron-log";
import * as React from "react";
import { CFG, selectAddressOrThrow } from "../../../../lib/cfg";
import { DEFAULT_TICKER_SYMBOL_LIST, moolaSecLendTokens } from "../config";
import { moolaSecLendToken } from "../moola-sec-lend-helper";

export const useTickerList = (): {
	tickers: moolaSecLendToken[];
	reload: () => void;
} => {
	const [changeN, setChangeN] = React.useState(0);
	const tickers = React.useMemo(() => {
		const registered = registeredList()
			.map((r) =>
				moolaSecLendTokens.find(
					(f) => selectAddressOrThrow(f.addresses) === r.address
				)
			)
			.filter((v) => v !== undefined) as moolaSecLendToken[];

		return registered;
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
	const tickers = moolaSecLendTokens.filter((r) => symbolSet.has(r.symbol));
	const list = tickers.map((t) => ({
		address: selectAddressOrThrow(t.addresses),
	}));

	setRegisteredList(list);
};

export const addTickerToList = (symbol: string): moolaSecLendToken => {
	const ticker = moolaSecLendTokens.find((r) => r.symbol === symbol);
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
