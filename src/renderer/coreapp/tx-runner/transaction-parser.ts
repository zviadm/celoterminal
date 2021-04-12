import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

import { fetchContractAbi, verifiedContractName } from "../../../lib/tx-parser/contract-abi"
import { ParsedTXData, parseTransactionData } from "../../../lib/tx-parser/tx-parser"
import { fmtAddress } from "../../../lib/utils"
import { Transaction } from "../../components/app-definition"

export interface ParsedTransaction {
	encodedABI: string,
	parsedTX?: ParsedTXData,
	parseErr?: string,
	sendValue?: BigNumber, // Amount of CELO (as WEI) sent directly.

	// Human readable values.
	contractName: string,
	contractAddress?: string,
}

export const parseTransaction = async (
	kit: ContractKit,
	tx: Transaction): Promise<ParsedTransaction> => {
	const contractAddress: string | undefined = tx.tx.txo._parent?.options.address
	const txEncodedAbi = tx.tx.txo.encodeABI()

	let name
	let parsedTX
	let parseErr
	if (contractAddress) {
		let verifiedName
		try {
			const contractAbi = await fetchContractAbi(kit, contractAddress)
			verifiedName = contractAbi.verifiedName
			parsedTX = parseTransactionData(kit.web3, contractAbi.abi, txEncodedAbi)
		} catch (e) {
			verifiedName = await verifiedContractName(kit, contractAddress)
			parseErr = `${e}`
		}
		name = verifiedName ? `${verifiedName} (${fmtAddress(contractAddress)})` : fmtAddress(contractAddress)
	} else {
		name = "DEPLOY NEW CONTRACT"
	}
	return {
		encodedABI: txEncodedAbi,
		parsedTX: parsedTX,
		parseErr: parseErr,
		sendValue: tx.params?.value ? new BigNumber(tx.params.value.toString()) : undefined,

		contractName: name,
		contractAddress: contractAddress,
	}
}