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
	const [installedApps, setInstalledApps] = useLocalStorageState<InstalledApp[]>("terminal/core/pinned-apps", [])

	const installApp = React.useCallback((id: string) => {
		if (installedApps.find((p) => p.id === id)) {
			return
		}
		const installedAppsCopy = installedApps.concat({id: id})
		setInstalledApps(installedAppsCopy)
	}, [installedApps, setInstalledApps])
	const uninstallApp = React.useCallback((id: string) => {
		// Wipe localStorage state for the app.
		const keyPrefix = `terminal/${id}/`
		const appKeys = Object.keys(localStorage).filter((k) => k.startsWith(keyPrefix))
		log.info(`uninstall[${id}]: removing keys: ${appKeys}...`)
		appKeys.forEach((key) => { localStorage.removeItem(key) })

		const installedAppsCopy = installedApps.filter((p) => p.id !== id)
		setInstalledApps(installedAppsCopy)
	}, [installedApps, setInstalledApps])
	return {
		installedApps: installedApps.map((p) => appsById.get(p.id)).filter((p) => p) as AppDefinition[],
		installApp,
		uninstallApp,
	}
}