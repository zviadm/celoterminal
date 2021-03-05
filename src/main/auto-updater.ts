import { app, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from '@ledgerhq/electron-updater'
import log from 'electron-log'

import { setForceQuit } from '.'

let _checkedOnStartup = false
let _updateReady: UpdateInfo | undefined
export const setupAutoUpdater = (): void => {
	if (app.isPackaged) {
		autoUpdater.autoInstallOnAppQuit = false
		autoUpdater.allowPrerelease = false
		setInterval(() => {
			autoUpdater.checkForUpdates()
		}, 30 * 60 * 1000) // Check every 30 minutes.
		autoUpdater.on("error", (e: Error) => {
			log.error("autoupdater:", e)
		})
		autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
			if (info.version !== _updateReady?.version) {
				log.info("autoupdater: update available", info)
			}
			_updateReady = info
		})
	}

	ipcMain.on("set-allow-prerelease", (event, allow) => {
		log.info(`autoupdater: allow-prerelease = ${allow}`)
		autoUpdater.allowPrerelease = allow
		if (!_checkedOnStartup) {
			autoUpdater.checkForUpdates()
			_checkedOnStartup = true
		}
		event.returnValue = null
	})
	ipcMain.on("check-update-ready", (event) => {
		event.returnValue = _updateReady?.version
	})
	ipcMain.on("quit-and-install", (event) => {
		log.info(`autoupdater: quit-and-install...`)
		setForceQuit()
		autoUpdater.quitAndInstall()
		event.returnValue = null
	})
}
