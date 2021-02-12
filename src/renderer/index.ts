import { ipcRenderer, remote } from 'electron'
import log from 'electron-log'
import { testOnlyAdjustNow } from './state/time'

log.transports.console.level = remote.app.isPackaged ? false : "debug"
log.transports.file.level = remote.app.isPackaged ? "info" : false

ipcRenderer.on("adjust-time", (event, increaseMS) => { testOnlyAdjustNow(increaseMS) })

import './styles.scss'
import './coreapp/app'

if (module.hot) {
	module.hot.accept()
}