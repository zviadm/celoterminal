import { abi as proxyABI, bytecode as proxyBytecode } from './Proxy.json'
import { abi as multiSigABI, bytecode as multiSigBytecode } from './MultiSig.json'
import { CeloTransactionObject, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'

export const multiSigDeployTXs = (kit: ContractKit): {tx: CeloTransactionObject<unknown>}[] => {
	const tx0 = toTransactionObject(
		kit.connection,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(new kit.web3.eth.Contract(proxyABI as any)).deploy({data: proxyBytecode}) as any)
	const tx1 = toTransactionObject(
		kit.connection,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(new kit.web3.eth.Contract(multiSigABI as any)).deploy({data: multiSigBytecode}) as any)
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
	const initializerAbi = multiSigABI.find((abi) => abi.type === 'function' && abi.name === 'initialize')
	const callData = kit.web3.eth.abi.encodeFunctionCall(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		initializerAbi as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[owners as any, requiredSignatures as any, requiredInternalSignatures as any])

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const proxy = new kit.web3.eth.Contract(proxyABI as any, proxyAddress)
	const txInit = toTransactionObject(
		kit.connection,
		proxy.methods._setAndInitializeImplementation(multiSigAddress, callData))
	const txChangeOwner = toTransactionObject(
		kit.connection,
		proxy.methods._transferOwnership(proxyAddress))
	return [{tx: txInit}, {tx: txChangeOwner}]
}