import { StrongAddress } from '@celo/base';
import { ContractKit } from "@celo/contractkit";
import Erc20Contract from "./erc20/erc20-contract";
import BigNumber from 'bignumber.js';

export type FeeToken = "auto" | FeeTokenInfo

export interface FeeTokenInfo {
	address?: StrongAddress // undefined is for CELO.
}

export async function selectFeeToken(kit: ContractKit, walletAddress: string): Promise<FeeTokenInfo> {
	const minGasAmt = 2_000_000
	const celoToken = await kit.contracts.getGoldToken()
	const [celoBalance, celoGasPrice] = await Promise.all([
		celoToken.balanceOf(walletAddress),
		kit.connection.gasPrice(),
	])
	const celoCanPayGasAmount = celoBalance.div(celoGasPrice)
	if (celoCanPayGasAmount.gte(minGasAmt)) {
		// Quick shortcut if we have enough CELO to perform most TXs.
		return {}
	}

	const feeTokenDir = await kit.contracts.getFeeCurrencyDirectory()
	const feeTokenAddrs = await feeTokenDir.getAddresses()
	const feeTokenInfos: { tknAddress: StrongAddress | undefined, canPayGasAmount: BigNumber }[] = await Promise.all(feeTokenAddrs.map(async (tknAddress) => {
		const erc20 = new Erc20Contract(kit, tknAddress)
		const gasPrice = new BigNumber(await kit.connection.gasPrice(tknAddress))
		const balance = await erc20.balanceOf(walletAddress)
		const canPayGasAmount = balance.div(gasPrice)
		return { tknAddress, canPayGasAmount }
	}))
	feeTokenInfos.push({ tknAddress: undefined, canPayGasAmount: celoCanPayGasAmount })
	feeTokenInfos.sort((a, b) => {
		return b.canPayGasAmount.minus(a.canPayGasAmount).toNumber()
	})
	return { address: feeTokenInfos[0].tknAddress }
}