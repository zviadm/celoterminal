import { ContractKit, newKitFromWeb3 } from "@celo/contractkit"
import { ReadOnlyWallet } from "@celo/connect"
import Web3 from "web3"
import net from "net"
import { CFG } from '../../lib/cfg'

const networkURLKeyPrefix = "terminal/core/network-url/"
let _cfgNetworkURL: string | undefined
export const cfgNetworkURL = (): string => {
	if (!_cfgNetworkURL) {
		const cfg = CFG()
		const networkURL: string | null = localStorage.getItem(networkURLKeyPrefix + cfg.chainId)
		_cfgNetworkURL = (networkURL && networkURL !== "") ? networkURL : cfg.defaultNetworkURL
	}
	return _cfgNetworkURL
}
const setCFGNetworkURL = (v: string) => {
	_cfgNetworkURL = v
	const cfg = CFG()
	const cfgValue = v === cfg.defaultNetworkURL ? "" : v
	localStorage.setItem(networkURLKeyPrefix + CFG().chainId, cfgValue)
}

let _kit: ContractKit | undefined
let _kitURL: string
const kitInstance = (): ContractKit => {
	const networkURL = cfgNetworkURL()
	if (_kit && _kitURL !== networkURL) {
		_kit.stop()
		_kit = undefined
	}
	if (!_kit) {
		_kitURL = networkURL
		_kit = newKitWithTimeout(_kitURL)
	}
	return _kit
}
export default kitInstance

export const useNetworkURL = (): [string, (v: string) => void] => {
	return [cfgNetworkURL(), setCFGNetworkURL]
}

export const newKitWithTimeout = (url: string, wallet?: ReadOnlyWallet): ContractKit => {
	let web3
	if (url.startsWith("http://") || url.startsWith("https://")) {
		web3 = new Web3(new Web3.providers.HttpProvider(url, {timeout: 30000}))
	} else if (url.startsWith("ws://") || url.startsWith("wss://")) {
		web3 = new Web3(new Web3.providers.WebsocketProvider(url, {timeout: 30000}))
	} else if (url.endsWith('.ipc')) {
		web3 = new Web3(new Web3.providers.IpcProvider(url, net))
	} else {
		web3 = new Web3(url)
	}
	return newKitFromWeb3(web3, wallet)
}