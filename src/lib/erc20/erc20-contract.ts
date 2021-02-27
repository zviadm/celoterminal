import { AbiItem, CeloTransactionObject, toTransactionObject } from "@celo/connect"
import { CeloContract, ContractKit } from "@celo/contractkit"
import { valueToBigNumber } from "@celo/contractkit/lib/wrappers/BaseWrapper"
import BigNumber from "bignumber.js"
import { RegisteredErc20 } from "./core"
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

	public decimals = async (): Promise<number> => {
		const r = await this.web3contract.methods.decimals().call()
		return Number.parseInt(r)
	}

	public balanceOf = async (address: string): Promise<BigNumber> => {
		const r = await this.web3contract.methods.balanceOf(address).call()
		return valueToBigNumber(r)
	}
}
export default Erc20Contract

export const newErc20 = async (kit: ContractKit, erc20: RegisteredErc20): Promise<Erc20Contract> => {
	let address
	switch (erc20.fullName) {
	case "CELO":
		address = await kit.registry.addressFor(CeloContract.GoldToken)
		break
	case "cUSD":
		address = await kit.registry.addressFor(CeloContract.StableToken)
		break
	default:
		address = erc20.address
		break
	}
	if (address === "") {
		throw new Error(`Unknown ERC20: ${erc20.fullName} - ${erc20.address}!`)
	}
	return new Erc20Contract(kit, address)
}