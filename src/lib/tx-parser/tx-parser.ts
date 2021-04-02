import { AbiInput, AbiItem } from "web3-utils"
import Web3 from 'web3';

export class TXParsingError extends Error {}

const fnSignatureLen = 10

export interface ParsedTXData {
	txAbi: AbiItem,
	txData: {input: AbiInput, value: unknown}[],
}

export const parseTransactionData = (
	web3: Web3,
	contractAbi: AbiItem[],
	txEncodedAbi: string): ParsedTXData => {

	console.info(`parsing`, contractAbi.length)
	let txAbi: AbiItem | undefined = undefined
	for (const abi of contractAbi) {
		if (abi.type === "fallback") {
			continue
		}
		const signature = web3.eth.abi.encodeFunctionSignature(abi)
		if (txEncodedAbi.startsWith(signature)) {
			txAbi = abi
			break
		}
	}
	if (!txAbi) {
		throw new TXParsingError("Function signature not found in Contract ABI.")
	}
	console.info(`txabi`, txAbi.name)
	const encodedParameters = txEncodedAbi.slice(fnSignatureLen)
	let txData: {input: AbiInput, value: unknown}[] = []
	if (encodedParameters) {
		if (!txAbi.inputs) {
			throw new TXParsingError(`Function: ${txAbi.name} does not take any parameters, but some where provided.`)
		}
		const decoded = web3.eth.abi.decodeParameters(txAbi.inputs, encodedParameters)
		txData = txAbi.inputs.map((i) => {
			const value = decoded[i.name]
			if (!value) {
				throw new TXParsingError(`Value not found for parameter: ${i.name}.`)
			}
			return {
				input: i,
				value: value,
			}
		})
	}
	return {
		txAbi,
		txData,
	}
}
