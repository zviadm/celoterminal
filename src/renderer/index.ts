import { ipcRenderer, remote } from 'electron'
import * as log from 'electron-log'
import { testOnlyAdjustNow } from './state/time'

log.transports.console.level = remote.app.isPackaged ? false : "debug"
log.transports.file.level = remote.app.isPackaged ? "info" : false
// console.log = log.log
// console.debug = log.debug
// console.info = log.info
// console.warn = log.warn
// console.error = log.error

ipcRenderer.on("adjust-time", (event, increaseMS) => { testOnlyAdjustNow(increaseMS) })

import './styles.scss'
import './coreapp/app'

if (module.hot) {
	module.hot.accept()
}