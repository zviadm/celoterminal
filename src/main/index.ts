import { app, BrowserWindow } from 'electron'
import path from 'path'
import { format as formatUrl } from 'url'
import log from 'electron-log'

import { setupAutoUpdater } from './auto-updater'
import { CFG } from '../lib/cfg'
import { testOnlySetupAccountsDB } from './test-utils'
import { SpectronAccountsDB } from '../lib/spectron-utils/constants'
import { setupMenu } from './menu'

// List of URLs that don't allow CORS requests. Celo Terminal is a native app thus
// CORS restrictions are completely unnecessary.
const CORSByPassURLs = [
	'https://repo.sourcify.dev/*',
]

declare const __static: string

const isSpectronTest = !app.isPackaged && !!process.env.SPECTRON_TEST
app.allowRendererProcessReuse = true
log.transports.console.level = app.isPackaged ? false : "debug"
log.transports.file.level = app.isPackaged ? "info" : false

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

	const noDevTools = app.isPackaged || isSpectronTest
	const noSplash = isSpectronTest // No splash screen during Spectron testing.
	const width = noDevTools ? 950 : 1100

	const iconOptions = isSpectronTest ? {} : {
		icon: path.join(__static, 'icon.png')
	}

	if (isSpectronTest &&
		CFG().accountsDBPath.path[CFG().accountsDBPath.path.length - 1] === SpectronAccountsDB) {
		testOnlySetupAccountsDB()
	}

	const window = new BrowserWindow({
		height: height,
		minWidth: minWidth,
		width: width,
		title: "Celo Terminal",
		webPreferences: {
			// Session/LocalStorage data is not persisted during testing.
			partition: !isSpectronTest ? "persist:default" : "test-default",
			// Keep dev tools available in prod builds too. Can be helpful for
			// debuging production binaries.
			devTools: true,

			// Celo Terminal renderer app is mostly treated as a native app too since
			// it needs to have access to USB (for hardware wallet) and to local file system
			// for accounts database.
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		},
		show: noSplash,
		// autoHide is causing unexpected issues during spectron tests. It is somehow
		// blocking the test runner to exit gracefully, causing tests to lock up. Thus,
		// do not autoHideMenuBar during tests.
		autoHideMenuBar: !isSpectronTest,
		...(process.platform === "darwin"
		? {
				frame: false,
				titleBarStyle: "hiddenInset",
			}
		: {}),
		...iconOptions,
	})

	if (!noDevTools) {
		window.webContents.openDevTools()
	}
	if (!app.isPackaged && !isSpectronTest) {
		window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
	} else {
		window.loadURL(formatUrl({
			pathname: !isSpectronTest ?
				path.join(__dirname, 'index.html') :
				path.join(__dirname, '../renderer/index.html'),
			protocol: 'file',
			slashes: true
		}))
	}

	if (!noSplash) {
		const splash = new BrowserWindow({
			height: 100,
			width: 200,
			frame: false,
			resizable: false,
			movable: false,
			webPreferences: {contextIsolation: true},
			...iconOptions,
		})
		splash.loadURL(`file://${__static}/splash.html`)

		window.on('ready-to-show', () => {
			window.show()
			splash.destroy()
		})
	}

	window.on('close', (event) => {
		if (hideInsteadOfQuit()) {
			event.preventDefault()
			window.hide()
		}
	})

	window.on('closed', () => {
		mainWindow = null
	})

	// Prevent any type of navigation. While nothing should be attempting to navigate
	// in the first place, this provides an additional safeguard if accidental mistakes
	// are made.
	window.webContents.on('will-navigate', (event) => {
		log.error(`main: navigation is not allowed...`)
		event.preventDefault()
	})
	window.webContents.on('will-redirect', (event) => {
		log.error(`main: navigation is not allowed...`)
		event.preventDefault()
	})

	// Bypass CORS restrictions since this is a native app, not a random website running
	// in the browser. Bypass happens by clearing `Origin` in the request headers.
	// Alternative approach would have been to set `webSecurity: false` when creating BrowserWindow,
	// but that is a bigger security relaxation compared to just overriding request headers.
	const corsFilter = {urls: CORSByPassURLs}
	let corsOrigin: string
	window.webContents.session.webRequest.onBeforeSendHeaders(
		corsFilter, (details, callback) => {
			corsOrigin = details.requestHeaders['Origin']
			details.requestHeaders['Origin'] = ''
			callback({ requestHeaders: details.requestHeaders })
		}
	)
	window.webContents.session.webRequest.onHeadersReceived(
    corsFilter, (details, callback) => {
			if (details.responseHeaders) {
				details.responseHeaders['Access-Control-Allow-Origin'] = [corsOrigin]
			}
      callback({ responseHeaders: details.responseHeaders });
    }
  )

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
			mainWindow.show()
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
		setupMenu()
		mainWindow = createMainWindow()
	})

	setupAutoUpdater()
}
