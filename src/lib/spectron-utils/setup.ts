import * as fs from 'fs'
import * as path from 'path'
import { exec, spawn } from 'child_process'
import { Application } from 'spectron'
import { Remote } from 'electron'
import { ContractKit, newKit } from '@celo/contractkit'

import { SpectronAccountsDB } from './constants'
import { sleep } from '../utils'

export const systemLog = (msg: string): void => {
	process.stdout.write(msg + "\n")
}

export const remote = (app: Application): Remote => {
	// spectron.Application is mistyped.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
  return (app!.electron as any).remote
}

export const startApp = async (): Promise<{app: Application, cleanup: () => Promise<void>}> => {
	const devchain = startDevchain()
	const rootPath = [__dirname, "..", "..", ".."]
	const app = new Application({
    // path: appPath,
    path: path.join(...rootPath, "node_modules", ".bin", "electron"),
    args: [path.join(...rootPath, "dist", "main", "main.js")],
    env: {
			"SPECTRON_TEST": "true",
			"CELOTERMINAL_ACCOUNTS_DB": "home/.celoterminal/" + SpectronAccountsDB,
			"CELOTERMINAL_NETWORK_ID": `1101`,
			"CELOTERMINAL_NETWORK_URL": `http://localhost:${devchainPort}`,
		},
	})
	await app.start()
	systemLog(`[test] app started`)
	await waitForDevchain()
	systemLog(`[test] celo-devchain ready`)
	const cleanup = async () => {
		systemLog(`[test] cleanup & exit...`)
		devchain.kill()
		if (app && app.isRunning()) {
			await app.stop()
		}
	}
	return {
		app,
		cleanup,
	}
}

const devchainPort = 7545
const startDevchain = () => {
	const logFile = "/tmp/spectron-test-devchain.log"
	systemLog(`[test] celo-devchain on port: ${devchainPort}, logs: ${logFile}...`)

	const logStream = fs.createWriteStream('/tmp/spectron-test-devchain.log', {flags: 'a'})
	const devchain = spawn(`yarn`, [`celo-devchain`, `--port`, `${devchainPort}`])
	devchain.stdout.pipe(logStream);
	devchain.stderr.pipe(logStream);
	return devchain
}
const waitForDevchain = async (timeoutMs?: number) => {
	const kit = devchainKit()
	const deadline = Date.now() + (timeoutMs || 30000)
	for (;;) {
		try {
			const networkId = await kit.web3.eth.net.getId()
			return networkId
		} catch (e) {
			if (Date.now() > deadline) {
				throw e
			}
			await sleep(500)
		}
	}
}

let _devKit: ContractKit | undefined
export const devchainKit = (): ContractKit => {
	if (!_devKit) {
		_devKit = newKit(`http://localhost:${devchainPort}`)
	}
	return _devKit
}