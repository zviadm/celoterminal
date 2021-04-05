import { ContractKit, newKitFromWeb3 } from "@celo/contractkit"
import { ReadOnlyWallet } from "@celo/connect"
import Web3 from "web3"
import net from "net"

export const newKitWithTimeout = (url: string, wallet?: ReadOnlyWallet): ContractKit => {
	let web3
	if (url.startsWith("http://") || url.startsWith("https://")) {
		web3 = new Web3(new Web3.providers.HttpProvider(url, {timeout: 15000}))
	} else if (url.startsWith("ws://") || url.startsWith("wss://")) {
		web3 = new Web3(new Web3.providers.WebsocketProvider(url, {timeout: 15000}))
	} else if (url.endsWith('.ipc')) {
		web3 = new Web3(new Web3.providers.IpcProvider(url, net))
	} else {
		web3 = new Web3(url)
	}
	return newKitFromWeb3(web3, wallet)
}