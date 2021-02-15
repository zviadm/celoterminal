import { AbiItem, CeloTransactionObject, toTransactionObject } from "@celo/connect"
import { ContractKit } from "@celo/contractkit"
import { valueToBigNumber } from "@celo/contractkit/lib/wrappers/BaseWrapper"
import BigNumber from "bignumber.js"
import erc20abi from "./erc20abi.json"

class ERC20 {
	public web3contract
	constructor(
		private kit: ContractKit,
		erc20address: string) {
		this.web3contract = new kit.web3.eth.Contract(erc20abi as AbiItem[], erc20address)
	}

	public transfer = (to: string, value: BigNumber.Value): CeloTransactionObject<unknown> => {
		return toTransactionObject(
			this.kit.connection,
			this.web3contract.methods.transfer(to, new BigNumber(value).toString(10))
		)
	}

	public decimals = async (): Promise<number> => {
		const r = await this.web3contract.methods.decimals().call()
		return Number.parseInt(r)
	}

	public balanceOf = async (address: string): Promise<BigNumber> => {
		const r = await this.web3contract.methods.balanceOf(address).call()
		return valueToBigNumber(r)
	}
}
export default ERC20