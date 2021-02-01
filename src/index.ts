import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'

declare const MAIN_WINDOW_WEBPACK_ENTRY: string

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const enableDevTools = !app.isPackaged
  const minWidth = 850
  const width = app.isPackaged ? minWidth : minWidth + 270
  const mainWindow = new BrowserWindow({
    height: 800,
    minWidth: minWidth,
    width: width,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // For now, always enable DevTools for debugging.
      devTools: true, //enableDevTools,
      partition: "persist:default",
    }
  });

  // Load the index.html of the app.
  mainWindow
    .loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
    .then(() => {
      if (enableDevTools) {
        mainWindow.webContents.openDevTools();
      }
    })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
let updateReady: UpdateInfo | undefined = undefined
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
    updateReady = info
  })
}

ipcMain.on("check-update-ready", (event) => {
  event.returnValue = updateReady?.version
})
ipcMain.on("quit-and-install", () => {
  autoUpdater.quitAndInstall()
})