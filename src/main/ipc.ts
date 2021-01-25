import { ipcMain } from 'electron'
import { channelRunTXs } from '../common/ipc'
import { handleRunTXs } from './handle-run-txs'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'

export function registerHandlers(): void {
	if (!TransportNodeHid.isSupported()) {
		throw new Error(`USB/HID not supported. Can not connect to Ledger!`)
	}
	ipcMain.handle(channelRunTXs, handleRunTXs)
	return
}