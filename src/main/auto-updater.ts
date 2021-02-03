import { app, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from '@ledgerhq/electron-updater'
import log from 'electron-log'

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
		app.relaunch()
		autoUpdater.quitAndInstall()
		event.returnValue = null
	})
}
