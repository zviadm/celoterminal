import * as os from 'os'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { ContractKit, newKit } from '@celo/contractkit'
import kill from 'tree-kill'

import { E2ETestAccountsDB, E2ETestChainId } from '../src/lib/e2e-constants'

const devchainPort = 7546
let _devchain: {devchain: ChildProcessWithoutNullStreams, devchainKilled: Promise<void>}

export const onPrepare = async () => {
	process.env.E2E_TEST = 'true'
	process.env.CELOTERMINAL_ACCOUNTS_DB = "home/.celoterminal/" + E2ETestAccountsDB
	process.env.CELOTERMINAL_NETWORK_ID = E2ETestChainId,
	process.env.CELOTERMINAL_NETWORK_URL = `http://localhost:${devchainPort}`
	return
}

export const beforeSession = async () => {
	_devchain = await startDevchain()
	return
}

export const afterSession = async () => {
	if (!_devchain) {
		return
	}
	_kill(_devchain.devchain)
	await _devchain.devchainKilled
}

// Bypasses Test Runners capturing of `console` to have cleaner stdout when running
// e2e tests.
export const testLog = (msg: string, opts?: {noNewLine?: boolean}): void => {
	process.stdout.write(opts?.noNewLine ? msg : msg + "\n")
}

let _devKit: ContractKit | undefined
// Returns ContractKit that points to celo-devchain instance.
export const devchainKit = (): ContractKit => {
	if (!_devKit) {
		_devKit = newKit(`http://localhost:${devchainPort}`)
	}
	return _devKit
}

const startDevchain = async () => {
	let _resolve: () => void
	const started = new Promise<void>((resolve) => { _resolve = resolve})

	const devchain = spawn(`yarn`, [`celo-devchain`, `--port`, `${devchainPort}`])
	devchain.on("error", (err) => {
		testLog(`[err]devchain: ${err}`)
	})
	const devchainKilled = new Promise<void>((resolve) => {
		devchain.on("close", () => { resolve () })
	})
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
	process.on("exit", () => {
		if (!devchain.killed) {
			_kill(devchain)
		}
	})
	await started
	return {devchain, devchainKilled}
}

const _kill = (process: ChildProcessWithoutNullStreams) => {
	if (os.platform() === "darwin" || !process.pid) {
		process.kill()
	} else {
		// For some reason on Ubuntu regular kill doesn't work. Thus
		// use tree-kill to really kill it well.
		kill(process.pid)
	}
}