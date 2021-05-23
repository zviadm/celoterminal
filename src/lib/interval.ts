import * as log from 'electron-log'
import { CancelPromise, sleep } from './utils';

export const runWithInterval = (
	name: string,
	f: () => Promise<unknown>,
	intervalMs: number): () => void => {
	const c = new CancelPromise()
	;(async () => {
		while (!c.isCancelled()) {
			const startMs = Date.now()
			try {
				await f()
			} catch (e) {
				log.error(`bg-job[${name}]: ${e}`)
			}
			if (c.isCancelled()) {
				return
			}
			const sleepMs = startMs + intervalMs - Date.now()
			if (sleepMs > 0) {
				await Promise.race([sleep(intervalMs), c.cancelPromise()])
			} else {
				log.warn(`bg-job[${name}]: f() took longer than interval by ${-sleepMs}ms`)
			}
		}
	})()
	return c.cancel
}
