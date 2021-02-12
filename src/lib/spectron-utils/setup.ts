import * as path from 'path'
import { spawn } from 'child_process'
import { Application } from 'spectron'
import { Remote } from 'electron'
import { ContractKit, newKit } from '@celo/contractkit'

import { SpectronAccountsDB, SpectronNetworkId } from './constants'

// Bypass Jest's capturing of `console` to have cleaner stdout when running
// spectron tests.
export const testLog = (msg: string, opts?: {noNewLine?: boolean}): void => {
	process.stdout.write(opts?.noNewLine ? msg : msg + "\n")
}

export const remote = (app: Application): Remote => {
	// spectron.Application is mistyped.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
	return (app!.electron as any).remote
}

export const startApp = async (): Promise<{app: Application, cleanup: () => Promise<void>}> => {
	const devchain = await startDevchain()

	const rootPath = [__dirname, "..", "..", ".."]
	const app = new Application({
		// path: appPath,
		path: path.join(...rootPath, "node_modules", ".bin", "electron"),
		args: [path.join(...rootPath, "dist", "main", "main.js")],
		env: {
			"SPECTRON_TEST": "true",
			"CELOTERMINAL_ACCOUNTS_DB": "home/.celoterminal/" + SpectronAccountsDB,
			"CELOTERMINAL_NETWORK_ID": SpectronNetworkId,
			"CELOTERMINAL_NETWORK_URL": `http://localhost:${devchainPort}`,
		},
	})
	testLog(`[test] app starting`)
	await app.start()
	testLog(`[test] app started`)
	// see: https://github.com/electron-userland/spectron/issues/763
	app.client.setTimeout({implicit: 0})

	const cleanup = async () => {
		testLog(`[test] cleanup & exit...`)
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
const startDevchain = async () => {
	const logFile = "/tmp/spectron-test-devchain.log"
	testLog(`[test] celo-devchain on port: ${devchainPort}, logs: ${logFile}...`)

	let _resolve: () => void
	const started = new Promise<void>((resolve) => { _resolve = resolve})

	const devchain = spawn(`yarn`, [`celo-devchain`, `--port`, `${devchainPort}`])
	devchain.stdout.on('data', (buf) => {
		const data: string = buf.toString()
		testLog(`[out]devchain: ${data}`, {noNewLine: true})
		if (data.includes("Ganache STARTED")) {
			_resolve()
		}
	})
	devchain.stderr.on('data', (buf) => {
		testLog(`[out]devchain: ${buf.toString()}`, {noNewLine: true})
	})
	await started
	return devchain
}

let _devKit: ContractKit | undefined
export const devchainKit = (): ContractKit => {
	if (!_devKit) {
		_devKit = newKit(`http://localhost:${devchainPort}`)
	}
	return _devKit
}