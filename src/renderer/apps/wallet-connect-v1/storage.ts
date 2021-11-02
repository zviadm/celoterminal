import log from 'electron-log'
import { CFG } from "../../../lib/cfg"

const storagePrefix = `terminal/wallet-connect/v1/storage/${CFG().chainId}/`
const sessionIdsKey = storagePrefix + `sessions`
const sessionPrefixKey = storagePrefix + `session/`

export const storedSessionIds = (): string[] => {
	const sessionIds: string[] = JSON.parse(localStorage.getItem(sessionIdsKey) || "[]")
	return sessionIds
}

export const newSessionStorageId = (): string => {
	const sessionId = sessionPrefixKey + `wc-session-${Date.now()}`
	const sessionIds = storedSessionIds()
	localStorage.setItem(sessionIdsKey, JSON.stringify([...sessionIds, sessionId]))
	return sessionId
}

export const removeSessionId = (sessionId: string): void => {
	const sessionIds = storedSessionIds().filter((id) => id !== sessionId)
	localStorage.setItem(sessionIdsKey, JSON.stringify(sessionIds))
}

export const wipeFullStorage = (): void => {
	const keys = Object.keys(localStorage).filter((k) => k.startsWith(storagePrefix))
	log.info(`wallet-connect: wiping storage: ${keys}...`)
	keys.forEach((key) => { localStorage.removeItem(key) })
}