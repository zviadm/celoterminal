import * as Web3 from "web3"
import { AbiItem } from "@celo/connect"

import erc20Abi from "../erc20/erc20-abi.json"
import { parseTransactionData } from "./tx-parser"

test('tx-parser examples', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const web3 = new (Web3 as any)()

	const exAddr = "0x1dbe73B0480058106798aDda62E25D5279233C1c"
	const ex0 = "0xa9059cbb0000000000000000000000001dbe73b0480058106798adda62e25d5279233c1c0000000000000000000000000000000000000000000000000de0b6b3a7640000"
	const parsedData = parseTransactionData(web3, erc20Abi as AbiItem[], ex0)
	expect(parsedData.txAbi.name).toEqual("transfer")
	expect(parsedData.txData).toHaveLength(2)
	expect(parsedData.txData[0].input.name).toEqual("_to")
	expect(parsedData.txData[0].value).toEqual(exAddr)
	expect(parsedData.txData[1].input.name).toEqual("_value")
	expect(parsedData.txData[1].value).toEqual(1e18.toFixed(0))
})