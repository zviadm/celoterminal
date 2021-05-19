import { remote } from "electron"

export const showWindowAndFocus = (): void => {
	const window = remote.getCurrentWindow()
	if (window.isMinimized()) {
		window.restore()
	}
	window.show()
}