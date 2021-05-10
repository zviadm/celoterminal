import * as log from 'electron-log'
import { CFG } from "../../../lib/cfg"

const storagePrefix = `terminal/wallet-connect/storage/${CFG().chainId}/`

export class SessionStorage {
  public getKeys = async (): Promise<string[]> => {
		return Object.keys(localStorage)
			.filter((k) => k.startsWith(storagePrefix))
			.map((k) => k.substring(storagePrefix.length))
	}

  public async getEntries<T>(): Promise<[string, T][]> {
		const keys = await this.getKeys()
		const r: [string, T][] = []
		for (const key of keys) {
			const v = await this.getItem<T>(key)
			if (v) {
				r.push([key, v])
			}
		}
		return r
	}

  public async getItem<T>(key: string): Promise<T | undefined> {
		const json = localStorage.getItem(storagePrefix + key)
		if (json) {
			try {
				const v: T = JSON.parse(json)
				return v
			} catch (e) {
				log.warn(`wallet-connect: getItem`, e)
			}
		}
		return undefined
	}

  public async setItem<T>(key: string, value: T): Promise<void> {
		const json = JSON.stringify(value)
		localStorage.setItem(storagePrefix+key, json)
	}

  public async removeItem(key: string): Promise<void> {
		localStorage.removeItem(storagePrefix+key)
	}
}

export default SessionStorage

