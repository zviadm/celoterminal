import { ContractKit } from "@celo/contractkit"
import { TransactionData } from "@celo/contractkit/lib/wrappers/MultiSig"
import { ContractABI, fetchContractAbi, verifiedContractName } from "../../../lib/tx-parser/contract-abi"
import { ParsedTXData, parseTransactionData } from "../../../lib/tx-parser/tx-parser"

export interface MultiSigTX extends TransactionData {
	idx: number
}

export interface ParsedTX {
	tx: MultiSigTX,
	destinationName: string,
	parsedTX?: ParsedTXData,
	parseErr?: string,
}

export const parseTXs = async (kit: ContractKit, txs: MultiSigTX[]): Promise<ParsedTX[]> => {
	const destinations = Array.from(new Set(txs.map((tx) => tx.destination)))
	const contractAbis = await Promise.all(
		destinations.map(async (d): Promise<[string, {c?: ContractABI, name: string, err?: Error}]> => {
			try {
				const r = await fetchContractAbi(kit, d)
				return [d, {c: r, name: r.contractName}]
			} catch (e) {
				const name = await verifiedContractName(kit, d)
				return [d, {name, err: e}]
			}
		})
	)
	const abiMap = new Map(contractAbis)
	return txs.map((tx) => {
		const contractAbi = abiMap.get(tx.destination)
		let parsedTX
		let parseErr
		if (!contractAbi?.c) {
			parseErr = `${contractAbi?.err}`
		} else {
			try {
				parsedTX = parseTransactionData(kit.web3, contractAbi.c.abi, tx.data)
			} catch (e) {
				parseErr = `${e}`
			}
		}
		return {
			tx: tx,
			destinationName: contractAbi?.name || "",
			parsedTX,
			parseErr,
		}
	})
}
