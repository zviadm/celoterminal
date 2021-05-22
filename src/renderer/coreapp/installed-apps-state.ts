import * as log from 'electron-log'
import * as React from 'react'

import { AppList } from '../apps/apps'
import { AppDefinition } from '../components/app-definition'
import useLocalStorageState from "../state/localstorage-state"

const appsById = new Map(AppList.map((a) => [a.id, a]))

export interface InstalledApp {
	id: string
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useInstalledApps = () => {
	const [_installedApps, setInstalledApps] = useLocalStorageState<InstalledApp[]>("terminal/core/pinned-apps", [])

	const installApp = React.useCallback((id: string) => {
		if (_installedApps.find((p) => p.id === id)) {
			return
		}
		const installedAppsCopy = _installedApps.concat({id: id})
		setInstalledApps(installedAppsCopy)
	}, [_installedApps, setInstalledApps])
	const uninstallApp = React.useCallback((id: string) => {
		// Wipe localStorage state for the app.
		const keyPrefix = `terminal/${id}/`
		const appKeys = Object.keys(localStorage).filter((k) => k.startsWith(keyPrefix))
		log.info(`uninstall[${id}]: removing keys: ${appKeys}...`)
		appKeys.forEach((key) => { localStorage.removeItem(key) })

		const installedAppsCopy = _installedApps.filter((p) => p.id !== id)
		setInstalledApps(installedAppsCopy)
	}, [_installedApps, setInstalledApps])
	const installedApps = React.useMemo(
		() => (_installedApps.map((p) => appsById.get(p.id)).filter((p) => p) as AppDefinition[]),
		[_installedApps])
	return {
		installedApps,
		installApp,
		uninstallApp,
	}
}