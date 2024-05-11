import * as remote from '@electron/remote'

export const showWindowAndFocus = (): void => {
	const window = remote.getCurrentWindow()
	if (window.isMinimized()) {
		window.restore()
	}
	window.show()
}