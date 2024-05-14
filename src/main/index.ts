import { app, BrowserWindow } from 'electron'
import path from 'path'
import log from 'electron-log'

import { setupAutoUpdater } from './auto-updater'
import { CFG } from '../lib/cfg'
import { E2ETestAccountsDB, IS_E2E_TEST } from '../lib/e2e-constants'
import { testOnlySetupAccountsDB } from './test-utils'
import { setupMenu } from './menu'
import * as remoteMain from "@electron/remote/main"

import celoTerminalIcon from './../../build/icon.png'

remoteMain.initialize()

// List of URLs that don't allow CORS requests. Celo Terminal is a native app thus
// CORS restrictions are completely unnecessary.
const CORSByPassURLs = [
	'https://repo.sourcify.dev/*',
]

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const SPLASH_WINDOW_WEBPACK_ENTRY: string;

log.transports.console.level = (app.isPackaged && !IS_E2E_TEST) ? false : "debug"
log.transports.file.level = (app.isPackaged && !IS_E2E_TEST) ? "info" : "debug"
log.transports.file.resolvePath = () => path.join(
	app.getPath("logs"),
	IS_E2E_TEST ? "celoterminal-e2e.main.log" :
	app.isPackaged ? 'main.log' : 'celoterminal-dev.main.log')

// Global reference to mainWindow (necessary to prevent window from being garbage collected).
let mainWindow: BrowserWindow | null = null
let willQuitApp = false
export const setForceQuit = (): void => { willQuitApp = true }
const hideInsteadOfQuit = () => {
	return !willQuitApp && process.platform === 'darwin'
}

function createMainWindow() {
	const height = 800
	const minWidth = 850

	const noDevTools = app.isPackaged || IS_E2E_TEST
	const noSplash = IS_E2E_TEST // No splash screen during e2e testing.
	const width = noDevTools ? 950 : 1100

	const iconOptions = IS_E2E_TEST ? {} : {icon: celoTerminalIcon}

	if (IS_E2E_TEST &&
		CFG().accountsDBPath.path[CFG().accountsDBPath.path.length - 1] === E2ETestAccountsDB) {
		testOnlySetupAccountsDB()
	}

	const window = new BrowserWindow({
		height: height,
		minWidth: minWidth,
		width: width,
		title: "Celo Terminal",
		webPreferences: {
			// Session/LocalStorage data is not persisted during testing.
			partition: !IS_E2E_TEST ? "persist:default" : "test-default",
			// Keep dev tools available in prod builds too. Can be helpful for
			// debuging production binaries.
			devTools: true,

			// Celo Terminal renderer app is mostly treated as a native app too since
			// it needs to have access to USB (for hardware wallet) and to local file system
			// for accounts database.
			nodeIntegration: true,
			contextIsolation: false,
		},
		show: noSplash,
		// autoHide is causing unexpected issues during e2e tests. It is somehow
		// blocking the test runner to exit gracefully, causing tests to lock up. Thus,
		// do not autoHideMenuBar during tests.
		autoHideMenuBar: !IS_E2E_TEST,
		...(process.platform === "darwin"
		? {
				frame: false,
				titleBarStyle: "hiddenInset",
			}
		: {}),
		...iconOptions,
	})
	remoteMain.enable(window.webContents)

	if (!noDevTools) {
		window.webContents.openDevTools()
	}
	window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

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
		splash.loadURL(SPLASH_WINDOW_WEBPACK_ENTRY)

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
	window.webContents.session.webRequest.onBeforeSendHeaders(
		corsFilter, (details, callback) => {
			details.requestHeaders['Origin'] = ''
			callback({ requestHeaders: details.requestHeaders })
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
