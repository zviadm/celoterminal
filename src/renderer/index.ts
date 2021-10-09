import path from "path"
import { ipcRenderer, remote } from 'electron'
import * as log from 'electron-log'
import { testOnlyAdjustNow } from './state/time'

log.transports.console.level = remote.app.isPackaged ? false : "debug"
log.transports.file.level = remote.app.isPackaged ? "info" : "debug"
log.transports.file.resolvePath = () => path.join(
	remote.app.getPath("logs"),
	remote.app.isPackaged ? 'renderer.log' : 'celoterminal-dev.renderer.log');
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