import { app, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from '@ledgerhq/electron-updater'
import log from 'electron-log'

import { setForceQuit } from '.'

let _updateReady: UpdateInfo | undefined
export const setupAutoUpdater = (): void => {
	if (app.isPackaged) {
		autoUpdater.autoInstallOnAppQuit = false
		autoUpdater.allowPrerelease = false
		autoUpdater.checkForUpdates()
		setInterval(() => {
			autoUpdater.checkForUpdates()
		}, 60 * 1000) // Check every 10 minutes.
		autoUpdater.on("error", (e: Error) => {
			log.error("autoupdater:", e)
		})
		autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
			log.info("autoupdater: update available", info)
			_updateReady = info
		})
	}

	ipcMain.on("set-allow-prerelease", (event, allow) => {
		autoUpdater.allowPrerelease = allow
		log.info(`autoupdater: allow-prerelease = ${allow}`)
		event.returnValue = null
	})
	ipcMain.on("check-update-ready", (event) => {
		event.returnValue = _updateReady?.version
	})
	ipcMain.on("quit-and-install", (event) => {
		log.info(`autoupdater: preparing to exit to install update...`)
		setForceQuit()
		app.relaunch()
		log.info(`autoupdater: relaunch flag set...`)
		autoUpdater.quitAndInstall()
		log.info(`autoupdater: quit-and-install called`)
		event.returnValue = null
	})
}
