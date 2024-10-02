import { StrongAddress } from '@celo/base';
import { ContractKit } from "@celo/contractkit";
import Erc20Contract from "./erc20/erc20-contract";

export type FeeToken = "auto" | FeeTokenInfo

export interface FeeTokenInfo {
	symbol: string
	decimals: number
	address?: StrongAddress
}

export async function selectFeeToken(kit: ContractKit, walletAddress: string): Promise<FeeTokenInfo> {
	const minGasAmt = 2_000_000
	const gasPriceMinimum = await kit.contracts.getGasPriceMinimum()

	const celoToken = await kit.contracts.getGoldToken()
	const feeTokenWhitelist = await kit.contracts.getFeeCurrencyWhitelist()
	const feeTokenAddrs = await feeTokenWhitelist.getAddresses()
	for (const tknAddress of [celoToken.address, ...feeTokenAddrs]) {
		const erc20 = new Erc20Contract(kit, tknAddress)
		console.info("DEBUG-FETCHING", tknAddress)
		try {
			const priceMin = await gasPriceMinimum.getGasPriceMinimum(tknAddress)
			const balance = await erc20.balanceOf(walletAddress)
			console.info("DEBUG", tknAddress, priceMin.toFixed(0), balance.toFixed(0))
			if (balance.gt(priceMin.multipliedBy(minGasAmt))) {
				const symbol = await erc20.symbol()
				const decimals = await erc20.decimals()
				return {
					symbol,
					decimals,
					address: tknAddress === celoToken.address ? undefined : tknAddress,
				}
			}
		} catch (e) {
			console.error("FAILED to fetch GasPrceInfo", e)
		}
	}
	return {
		symbol: await celoToken.symbol(),
		decimals: await celoToken.decimals(),
	}
}