import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

import { contractName } from "../../../lib/registry"
import { Transaction } from "../../components/app-definition"

export interface ParsedTransaction {
	encodedABI: string,
	transferValue?: BigNumber, // Amount of directly transfering CELO.

	// Human readable values.
	contractName: string,
	contractAddress?: string,
}

export const parseTransaction = async (
	kit: ContractKit,
	tx: Transaction): Promise<ParsedTransaction> => {
	const contractAddress: string | undefined = tx.tx.txo._parent?.options.address
	const name = contractAddress ? await contractName(kit, contractAddress) : "DEPLOY NEW CONTRACT"
	return {
		encodedABI: tx.tx.txo.encodeABI(),
		transferValue: tx.params?.value ? new BigNumber(tx.params.value.toString()) : undefined,

		contractName: name,
		contractAddress: contractAddress,
	}
}