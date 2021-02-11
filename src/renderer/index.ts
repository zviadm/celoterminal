import { remote } from 'electron'
import log from 'electron-log'

log.transports.console.level = remote.app.isPackaged ? false : "debug"
log.transports.file.level = remote.app.isPackaged ? "info" : false

import './styles.scss'
import './coreapp/app'

if (module.hot) {
	module.hot.accept()
}