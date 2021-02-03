import { ContractKit, newKit } from '@celo/contractkit'
import { CFG } from '../../lib/cfg'

const networkURLKeyPrefix = "terminal/core/network-url/"
let _cfgNetworkURL: string | undefined
export const cfgNetworkURL = (): string => {
	if (!_cfgNetworkURL) {
		const cfg = CFG()
		const networkURL: string | null = localStorage.getItem(networkURLKeyPrefix + cfg.networkId)
		_cfgNetworkURL = (networkURL && networkURL !== "") ? networkURL : cfg.defaultNetworkURL
	}
	return _cfgNetworkURL
}
const setCFGNetworkURL = (v: string) => {
	_cfgNetworkURL = v
	const cfg = CFG()
	const cfgValue = v === cfg.defaultNetworkURL ? "" : v
	localStorage.setItem(networkURLKeyPrefix + CFG().networkId, cfgValue)
}

let _kit: ContractKit | undefined
let _kitURL: string
const kit = (): ContractKit => {
	const networkURL = cfgNetworkURL()
	if (_kit && _kitURL !== networkURL) {
		_kit.stop()
		_kit = undefined
	}
	if (!_kit) {
		_kitURL = networkURL
		_kit = newKit(_kitURL)
	}
	return _kit
}
export default kit

export const useNetworkURL = (): [string, (v: string) => void] => {
	return [cfgNetworkURL(), setCFGNetworkURL]
}
