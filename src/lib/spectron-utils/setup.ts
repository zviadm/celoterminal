import * as path from 'path'
import { Application } from 'spectron'
import { Remote } from 'electron'
import { SpectronAccountsDB } from './constants'

export const remote = (app: Application): Remote => {
	// spectron.Application is mistyped.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
  return (app!.electron as any).remote
}

export const startApp = async (): Promise<Application> => {
	const rootPath = [__dirname, "..", "..", ".."]
	const app = new Application({
    // path: appPath,
    path: path.join(...rootPath, "node_modules", ".bin", "electron"),
    args: [path.join(...rootPath, "dist", "main", "main.js")],
    env: {
			"SPECTRON_TEST": "true",
			"CELOTERMINAL_ACCOUNTS_DB": "home/.celoterminal/" + SpectronAccountsDB,
		},
	})
	await app.start()
	return app
}
