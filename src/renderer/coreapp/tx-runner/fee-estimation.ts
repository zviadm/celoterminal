import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

import { sleep } from "../../../lib/utils"
import { Transaction } from "../../components/app-definition"
import { CeloTx } from "@celo/connect"

export interface EstimatedFee {
	estimatedGas: BigNumber, // Gas price in WEI

	// Human readable values.
	estimatedFee: BigNumber,
	feeCurrency: string,
}


export const estimateGas = async (
	kit: ContractKit,
	tx: Transaction,
	paramsFilled: CeloTx): Promise<BigNumber> => {
	if (paramsFilled.gas) {
		return new BigNumber(paramsFilled.gas)
	}
	if (tx.tx === "eth_signTransaction" || tx.tx === "eth_sendTransaction") {
		console.log("DEBUG-ESTIAMTE-GAS", paramsFilled)
		return new BigNumber(await kit.connection.estimateGasWithInflationFactor(paramsFilled))
	}
	if (tx.tx.defaultParams?.gas) {
		return new BigNumber(tx.tx.defaultParams?.gas)
	}
	for (let tryN = 0; ; tryN++) {
		try {
			const txObj = tx.tx.txo
			const gasEstimator = (_tx: CeloTx) => txObj.estimateGas({ ..._tx })
			const getCallTx = (_tx: CeloTx) => {
				return { ..._tx, data: txObj.encodeABI(), to: txObj._parent.options.address }
			}
			const caller = (_tx: CeloTx) => kit.connection.web3.eth.call(getCallTx(_tx))
			const estimatedGas = await kit.connection.estimateGasWithInflationFactor(paramsFilled, gasEstimator, caller)
			return new BigNumber(estimatedGas)
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