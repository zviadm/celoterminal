import { ContractKit } from "@celo/contractkit"
import { TransactionData } from "@celo/contractkit/lib/wrappers/MultiSig"
import { ContractABI, fetchContractAbi, verifiedContractName } from "../../../lib/tx-parser/contract-abi"
import { ParsedTXData, parseTransactionData } from "../../../lib/tx-parser/tx-parser"

export interface MultiSigTX extends TransactionData {
	idx: number
}

export interface ParsedTX {
	tx: MultiSigTX,
	verifiedDestinationName: string | null,
	parsedTX?: ParsedTXData,
	parseErr?: string,
}

export const parseTXs = async (kit: ContractKit, txs: MultiSigTX[]): Promise<ParsedTX[]> => {
	const destinations = Array.from(new Set(txs.map((tx) => tx.destination)))
	const contractAbis = await Promise.all(
		destinations.map(async (d): Promise<[string, {c?: ContractABI, verifiedName: string | null, err?: Error}]> => {
			try {
				const r = await fetchContractAbi(kit, d)
				return [d, {c: r, verifiedName: r.verifiedName}]
			} catch (e) {
				const verifiedName = await verifiedContractName(kit, d)
				return [d, {verifiedName, err: e}]
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
			verifiedDestinationName: contractAbi?.verifiedName || null,
			parsedTX,
			parseErr,
		}
	})
}
