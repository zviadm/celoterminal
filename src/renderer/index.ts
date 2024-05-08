import path from "path"
import { ipcRenderer } from 'electron'
import * as remote from '@electron/remote'
import * as log from 'electron-log'
import { IS_E2E_TEST } from "../lib/e2e-constants"
import { testOnlyAdjustNow } from './state/time'

log.transports.console.level = (remote.app.isPackaged && !IS_E2E_TEST) ? false : "debug"
log.transports.file.level = (remote.app.isPackaged && !IS_E2E_TEST) ? "info" : "debug"
log.transports.file.resolvePath = () => path.join(
	remote.app.getPath("logs"),
	IS_E2E_TEST ? 'celoterminal-e2e.renderer.log' :
	remote.app.isPackaged ? 'renderer.log' : 'celoterminal-dev.renderer.log');
// console.log = log.log
// console.debug = log.debug
// console.info = log.info
// console.warn = log.warn
// console.error = log.error

ipcRenderer.on("adjust-time", (event, increaseMS) => { testOnlyAdjustNow(increaseMS) })

import './styles.scss'
import './coreapp/app'

