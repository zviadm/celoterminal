import { CeloTokenType, ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

import { coreErc20s, RegisteredErc20 } from "./core"

export const coreErc20Conversions = async (
	kit: ContractKit,
	to: CeloTokenType,
): Promise<Map<string, BigNumber>> => {
	const sortedOracles = await kit.contracts.getSortedOracles()
	const one = new BigNumber(1)

	const rateFromCELO = to === "CELO" ? one :
		(await sortedOracles.medianRate(kit.celoTokens.getContract(to))).rate

	const r = coreErc20s.map((e) => {
		return (async () => {
			if (e.symbol === to) {
				return [e.symbol, one]
			}

			const invRateToCELO = e.symbol === "CELO" ? one :
				(await sortedOracles.medianRate(kit.celoTokens.getContract(e.symbol))).rate
			const rate = rateFromCELO.div(invRateToCELO)
			return [e.symbol, rate]
		})() as Promise<[string, BigNumber]>
	})
	return new Map(await Promise.all(r))
}

export const registeredErc20ConversionRates = async (
	kit: ContractKit,
	to: CeloTokenType,
	erc20s: RegisteredErc20[]): Promise<Map<string, BigNumber>> => {

	const coreConversions = await coreErc20Conversions(kit, to)
	const rates: Promise<[string, BigNumber]>[] = []
	for (const erc20 of erc20s) {
		const erc20address = erc20.address
		if (!erc20address) {
			const rate = coreConversions.get(erc20.symbol)
			if (rate) {
				rates.push(Promise.resolve([erc20.symbol, rate]))
			}
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
					amount.multipliedBy(coreConversions.get(coreErc20) || 0).div(one),
				]
			})
		rates.push(rate)
	}
	return new Map(await Promise.all(rates))
}