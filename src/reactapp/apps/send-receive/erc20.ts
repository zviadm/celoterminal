import { AbiItem, CeloTransactionObject, toTransactionObject } from "@celo/connect";
import { ContractKit } from "@celo/contractkit";
import { valueToBigNumber } from "@celo/contractkit/lib/wrappers/BaseWrapper";
import BigNumber from "bignumber.js";
import erc20abi from "./erc20abi.json"

class ERC20 {
	private contract
	constructor(
		private kit: ContractKit,
		erc20address: string) {
		this.contract = new kit.web3.eth.Contract(erc20abi as AbiItem[], erc20address)
	}

	public transfer = (to: string, value: BigNumber.Value): CeloTransactionObject<unknown> => {
		return toTransactionObject(
			this.kit.connection,
			this.contract.methods.transfer(to, new BigNumber(value).toString(10))
		)
	}

	public decimals = async (): Promise<number> => {
		const r = await this.contract.methods.decimals().call()
		return r
	}

	public balanceOf = async (address: string): Promise<BigNumber> => {
		const r = await this.contract.methods.balanceOf(address).call()
		return valueToBigNumber(r)
	}
}
export default ERC20