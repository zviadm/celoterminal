import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

import { sleep } from "../../../lib/utils"
import { Transaction } from "../../components/app-definition"

export interface EstimatedFee {
	estimatedGas: BigNumber, // Gas price in WEI

	// Human readable values.
	estimatedFee: BigNumber,
	feeCurrency: string,
}


export const estimateGas = async (
	kit: ContractKit,
	tx: Transaction): Promise<BigNumber> => {
	if (tx.params?.gas) {
		return new BigNumber(tx.params?.gas)
	}
	if (tx.tx.defaultParams?.gas) {
		return new BigNumber(tx.tx.defaultParams?.gas)
	}
	for (let tryN = 0; ; tryN++) {
		try {
			const estimatedGas = await tx.tx.txo.estimateGas(tx.params)
			return new BigNumber(
				estimatedGas).multipliedBy(kit.gasInflationFactor).integerValue()
		} catch (e) {
			// Gas estimation can temporarily fail for various reasons. Most common problem can
			// be with subsequent transactions when a particular node hasn't yet caught up with
			// the head chain. Retrying 3x is safe and reasonably cheap.
			if (tryN >= 2) {
				throw e
			}
			await sleep(1000)
		}
	}
}