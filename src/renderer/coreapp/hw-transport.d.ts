declare module '@ledgerhq/hw-transport-node-hid-noevents'

declare module '@ledgerhq/hw-app-eth' {
	import Transport from '@ledgerhq/hw-transport'

	class Eth {
		constructor(transport: Transport, scrambleKey = 'w0w')
		getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean): Promise<{publicKey: string, address: string, chainCode: string?}>
	}

	export default Eth
}
