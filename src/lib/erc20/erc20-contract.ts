import { AbiItem, CeloTransactionObject, toTransactionObject } from "@celo/connect"
import { CeloContract, ContractKit } from "@celo/contractkit"
import { valueToBigNumber } from "@celo/contractkit/lib/wrappers/BaseWrapper"
import BigNumber from "bignumber.js"
import { CoreErc20, RegisteredErc20, stableTokenSuffix } from "./core"
import erc20abi from "./erc20-abi.json"

class Erc20Contract {
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

	public approve = (spender: string, v: BigNumber.Value): CeloTransactionObject<unknown> => {
		return toTransactionObject(
			this.kit.connection,
			this.web3contract.methods.approve(spender, new BigNumber(v).toString(10))
		)
	}

	public decimals = async (): Promise<number> => {
		const r = await this.web3contract.methods.decimals().call()
		return Number.parseInt(r)
	}

	public name = async (): Promise<string> => {
		return this.web3contract.methods.name().call()
	}

	public symbol = async (): Promise<string> => {
		return this.web3contract.methods.symbol().call()
	}

	public balanceOf = async (address: string): Promise<BigNumber> => {
		const r = await this.web3contract.methods.balanceOf(address).call()
		return valueToBigNumber(r)
	}

	public allowance = async (owner: string, spender: string): Promise<BigNumber> => {
		const r = await this.web3contract.methods.allowance(owner, spender).call()
		return valueToBigNumber(r)
	}
}
export default Erc20Contract

export const newErc20 = async (kit: ContractKit, erc20: RegisteredErc20): Promise<Erc20Contract> => {
	let address = erc20.address
	if (!address) {
		const coreErc20 = erc20.symbol as CoreErc20
		switch (coreErc20) {
		case "CELO":
			address = await kit.registry.addressFor(CeloContract.GoldToken)
			break
		default:
			address = await kit.registry.addressFor(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				CeloContract.StableToken + stableTokenSuffix(coreErc20) as any)
			break
		}
	}
	return new Erc20Contract(kit, address)
}
