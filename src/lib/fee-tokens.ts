import { StrongAddress } from '@celo/base';
import { ContractKit } from "@celo/contractkit";
import Erc20Contract from "./erc20/erc20-contract";
import BigNumber from 'bignumber.js';

export type FeeToken = "auto" | FeeTokenInfo

export interface FeeTokenInfo {
	address?: StrongAddress
}

export async function selectFeeToken(kit: ContractKit, walletAddress: string): Promise<FeeTokenInfo> {
	const minGasAmt = 2_000_000
	const celoToken = await kit.contracts.getGoldToken()
	const [celoBalance, gasPrice] = await Promise.all([
		celoToken.balanceOf(walletAddress),
		kit.connection.gasPrice(),
	])
	if (celoBalance.gt(new BigNumber(gasPrice).multipliedBy(minGasAmt))) {
		return {}
	}

	const feeTokenDir = await kit.contracts.getFeeCurrencyDirectory()
	const feeTokenAddrs = await feeTokenDir.getAddresses()
	const feeTokenInfos = await Promise.all(feeTokenAddrs.map(async (tknAddress) => {
		const erc20 = new Erc20Contract(kit, tknAddress)
		const gasPrice = new BigNumber(await kit.connection.gasPrice(tknAddress))
		const balance = await erc20.balanceOf(walletAddress)
		return { tknAddress, balance, gasPrice }
	}))
	feeTokenInfos.sort((a, b) => b.balance.minus(a.balance).toNumber())
	for (const feeTokenInfo of feeTokenInfos) {
		if (feeTokenInfo.balance.gt(feeTokenInfo.gasPrice.multipliedBy(minGasAmt))) {
			return { address: feeTokenInfo.tknAddress }
		}
	}
	return {}
}