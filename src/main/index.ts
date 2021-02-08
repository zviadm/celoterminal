import { app, BrowserWindow } from 'electron'
import path from 'path'
import { format as formatUrl } from 'url'
import { setupAutoUpdater } from './auto-updater'

declare const __static: string

app.allowRendererProcessReuse = true

// Global reference to mainWindow (necessary to prevent window from being garbage collected).
let mainWindow: BrowserWindow | null
let willQuitApp = false
export const setForceQuit = (): void => { willQuitApp = true }
const hideInsteadOfQuit = () => {
	return !willQuitApp && process.platform === 'darwin'
}

function createMainWindow() {
	const height = 800
	const minWidth = 850
	const width = app.isPackaged ? minWidth : minWidth + 270
	const window = new BrowserWindow({
		height: height,
		minWidth: minWidth,
		width: width,
		title: "Celo Terminal",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
			partition: "persist:default",
			devTools: !app.isPackaged,
		},
		show: false,
	})

	if (!app.isPackaged) {
		window.webContents.openDevTools()
	}
	if (!app.isPackaged) {
		window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
	} else {
		window.loadURL(formatUrl({
			pathname: path.join(__dirname, 'index.html'),
			protocol: 'file',
			slashes: true
		}))
	}

	const splash = new BrowserWindow({
		height: 100,
		width: 200,
		frame: false,
		resizable: false,
		movable: false,
		webPreferences: {contextIsolation: true},
	})
	splash.loadURL(`file://${__static}/splash.html`)

	window.on('ready-to-show', () => {
		window.show()
		splash.destroy()
	})

	window.on('close', (event) => {
		if (hideInsteadOfQuit()) {
			event.preventDefault()
			window.hide()
		}
	})

	window.on('closed', () => {
		mainWindow = null
	})

	window.webContents.on('devtools-opened', () => {
		window.focus()
		setImmediate(() => {
			window.focus()
		})
	})

	return window
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
	app.quit();
} else {
	app.on("second-instance", () => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) {
				mainWindow.restore()
			}
			mainWindow.focus()
		}
	})

	// Before quit fires when app needs to actually exit.
	app.on('before-quit', () => willQuitApp = true);

	// Quit application when all windows are closed (except for macOS).
	app.on('window-all-closed', () => {
		// on macOS it is common for applications to stay open until the user explicitly quits.
		if (!hideInsteadOfQuit()) {
			app.quit()
		}
	})

	app.on('activate', () => {
		// on macOS it is common to re-create a window even after all windows have been closed.
		if (mainWindow === null) {
			mainWindow = createMainWindow()
		} else {
			mainWindow.show()
		}
	})

	// Create main BrowserWindow when electron is ready.
	app.on('ready', () => {
		mainWindow = createMainWindow()
	})

	setupAutoUpdater()
}