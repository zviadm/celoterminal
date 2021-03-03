import { CeloContract, ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

import { CoreErc20, RegisteredErc20 } from "../../../lib/erc20/core"

export const fetchConversionRates = async (
	kit: ContractKit,
	to: CoreErc20,
	erc20s: RegisteredErc20[]): Promise<Map<string, BigNumber>> => {

	// TODO(zviad): This section should be more generic once cEUR is added.
	const sortedOracles = await kit.contracts.getSortedOracles()
	const ratesFromCELO = {
		cUSD: (await sortedOracles.medianRate(CeloContract.StableToken)).rate,
	}
	const one = new BigNumber(1)
	let convertRates: {[key: string]: BigNumber}
	switch (to) {
	case "CELO":
		convertRates = {
			CELO: one,
			cUSD: one.div(ratesFromCELO.cUSD),
		}
		break
	case "cUSD":
		convertRates = {
			cUSD: one,
			CELO: ratesFromCELO.cUSD,
		}
		break
	}
	const rates: Promise<[string, BigNumber]>[] = []
	for (const erc20 of erc20s) {
		const erc20address = erc20.address
		if (!erc20address) {
			rates.push(Promise.resolve([erc20.symbol, convertRates[erc20.symbol]]))
			continue
		}
		if (!erc20.conversion) {
			continue
		}
		const one = new BigNumber(1).shiftedBy(-erc20.decimals)
		const rate: Promise<[string, BigNumber]> = erc20
			.conversion(kit, erc20.symbol, one)
			.then(({coreErc20, amount}) => {
				return [
					erc20address,
					amount.multipliedBy(convertRates[coreErc20]).div(one),
				]
			})
		rates.push(rate)
	}
	return new Map(await Promise.all(rates))
}