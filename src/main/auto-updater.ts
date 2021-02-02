import { app, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'

let _updateReady: UpdateInfo | undefined
export const setupAutoUpdater = () => {
	if (app.isPackaged) {
		// const versionURL = `${process.platform}-${process.arch}/${app.getVersion()}`
		// const feedURL = `https://update.electronjs.org/zviadm/celoterminal/${versionURL}`
		autoUpdater.autoInstallOnAppQuit = false
		autoUpdater.allowPrerelease = true
		autoUpdater.setFeedURL({
			provider: "github",
			owner: "zviadm",
			repo: "celoterminal",
			token: "7ee4ccfd7e9404ceb59323ee3cb38e6bede63508",
			private: true,
		})
		autoUpdater.checkForUpdates()
		setInterval(() => {
			autoUpdater.checkForUpdates()
		}, 60 * 1000) // Check every 10 minutes.
		autoUpdater.on("error", (e: Error) => {
			console.error("autoupdater:", e)
		})
		autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
			console.error("autoupdater: update available", info)
			_updateReady = info
		})
	}

	ipcMain.on("check-update-ready", (event) => {
		event.returnValue = _updateReady?.version
	})
	ipcMain.on("quit-and-install", () => {
		autoUpdater.quitAndInstall()
	})
}
