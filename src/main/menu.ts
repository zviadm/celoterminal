import { Menu, MenuItemConstructorOptions, shell } from 'electron'

export const setupMenu = (): void => {
	const isMac = process.platform === "darwin"
	const appMenu: MenuItemConstructorOptions[] = (isMac ? [{ role: 'appMenu' }] : [])
	const template: MenuItemConstructorOptions[] = [
		...appMenu,
		{ role: 'fileMenu' },
		{ role: 'editMenu' },
		{ role: 'viewMenu' },
		{ role: 'windowMenu' },
		{ role: 'help',
			submenu: [{
				label: "Report an issue",
				click: async () => {
          await shell.openExternal('https://github.com/zviadm/celoterminal/issues/new/choose')
        }
			}, {
				label: "Guides and Tutorials",
				click: async () => {
          await shell.openExternal('https://github.com/zviadm/celoterminal/wiki')
        }
			}],
		},
	]
	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}
