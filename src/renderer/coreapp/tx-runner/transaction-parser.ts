import { ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"

import { fetchContractAbi, verifiedContractName } from "../../../lib/tx-parser/contract-abi"
import { ParsedTXData, parseTransactionData } from "../../../lib/tx-parser/tx-parser"
import { fmtAddress } from "../../../lib/utils"
import { SignatureRequest, Transaction } from "../../components/app-definition"

export interface ParsedTransaction {
	type: "transaction"
	encodedABI: string,
	parsedTX?: ParsedTXData,
	parseErr?: string,
	sendValue?: BigNumber, // Amount of CELO (as WEI) sent directly.

	// Human readable values.
	contractName: string,
	contractAddress?: string,
}

export type ParsedSignatureRequest = ParsedTransaction

export const extractTXDestinationAndData = (tx: Transaction): {destination?: string, data?: string} => {
	return {
		destination: tx.tx === "eth_signTransaction" || tx.tx === "eth_sendTransaction" ? tx.params?.to : tx.tx.txo._parent?.options.address,
		data: tx.tx === "eth_signTransaction" || tx.tx === "eth_sendTransaction" ? tx.params?.data : tx.tx.txo.encodeABI(),
	}
}

export const parseTransaction = async (
	kit: ContractKit,
	tx: Transaction): Promise<ParsedTransaction> => {
	const {destination, data} = extractTXDestinationAndData(tx)
	if (!data) {
		throw new Error(`Unexpected Error: Failed to parse transaction data.`)
	}

	let name
	let parsedTX
	let parseErr
	if (destination) {
		let verifiedName
		try {
			const contractAbi = await fetchContractAbi(kit, destination)
			verifiedName = contractAbi.verifiedName
			parsedTX = parseTransactionData(kit.web3, contractAbi.abi, data)
		} catch (e) {
			verifiedName = await verifiedContractName(kit, destination)
			parseErr = `${e}`
		}
		name = verifiedName ? `${verifiedName} (${fmtAddress(destination)})` : fmtAddress(destination)
	} else {
		name = "DEPLOY NEW CONTRACT"
	}
	return {
		type: "transaction",
		encodedABI: data,
		parsedTX: parsedTX,
		parseErr: parseErr,
		sendValue: tx.params?.value ? new BigNumber(tx.params.value.toString()) : undefined,

		contractName: name,
		contractAddress: destination,
	}
}

export const parseSignatureRequest = async (
	kit: ContractKit,
	req: SignatureRequest): Promise<ParsedSignatureRequest> => {
	switch (req.type) {
	case undefined:
		return parseTransaction(kit, req)
	case "signPersonal":
		throw new Error("not implemented")
	}
}