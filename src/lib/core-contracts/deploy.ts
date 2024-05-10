import PROXY_V1_JSON from './Proxy-v1.json'
import MULTISIG_JSON from './MultiSig.json'
import { AbiItem, CeloTransactionObject, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'

export const multiSigDeployTXs = (kit: ContractKit): {tx: CeloTransactionObject<unknown>}[] => {
	const tx0 = toTransactionObject(
		kit.connection,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(new kit.web3.eth.Contract(PROXY_V1_JSON.abi as AbiItem[])).deploy({data: PROXY_V1_JSON.bytecode}) as any)
	const tx1 = toTransactionObject(
		kit.connection,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(new kit.web3.eth.Contract(MULTISIG_JSON.abi as AbiItem[])).deploy({data: MULTISIG_JSON.bytecode}) as any)
	return [{tx: tx0}, {tx: tx1}]
}

export const multiSigInitializeTXs = (
	kit: ContractKit,
	proxyAddress: string,
	multiSigAddress: string,
	owners: string[],
	requiredSignatures: number,
	requiredInternalSignatures: number
): {tx: CeloTransactionObject<unknown>}[] => {
	const initializerAbi = MULTISIG_JSON.abi.find((abi) => abi.type === 'function' && abi.name === 'initialize')
	const callData = kit.web3.eth.abi.encodeFunctionCall(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		initializerAbi as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[owners as any, requiredSignatures as any, requiredInternalSignatures as any])

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const proxy = new kit.web3.eth.Contract(PROXY_V1_JSON.abi as AbiItem[], proxyAddress)
	const txInit = toTransactionObject(
		kit.connection,
		proxy.methods._setAndInitializeImplementation(multiSigAddress, callData))
	const txChangeOwner = toTransactionObject(
		kit.connection,
		proxy.methods._transferOwnership(proxyAddress))
	return [{tx: txInit}, {tx: txChangeOwner}]
}