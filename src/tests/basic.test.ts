import * as path from 'path'
import { Application } from 'spectron'
import { Remote } from 'electron'

import { sleep } from '../lib/utils'

jest.setTimeout(60000)
let app: Application | null = null

const remote = (): Remote => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
  return (app!.electron as any).remote
}

beforeAll(async () => {
  // const appPath = path.join(
  //   __dirname, "..", "..", "dist", "mac",
  //   "Celo Terminal.app", "Contents", "MacOS", "Celo Terminal")
  // console.info(`APP:`, appPath)
	app = new Application({
    // path: appPath,
    path: path.join(
      __dirname, "..", "..", "node_modules", ".bin", "electron"),
    args: [
      path.join(
        __dirname, "..", "..", "dist", "main", "main.js")],
    env: {"SPECTRON_TEST": "true"},
	})
	await app.start()
  await waitForMainWindow()
})

afterAll(async () => {
  if (app && app.isRunning()) {
    console.info("APP: exiting...")
    await app.stop()
  }
	return
})

const waitForMainWindow = async () => {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    const windows = await app?.client.getWindowCount()
    if (windows && windows > 0) {
      await app?.client.windowByIndex(windows - 1)
      const element = await app?.client.$("#menu-accounts")
      if (element) {
        const text = await element.getText()
        if (text === "Accounts") {
          return
        }
      }
    }
    await sleep(500)
  }
  throw new Error("`#menu-accounts` element never became visible")
}

test('App Init', async (done) => {
  const count = await app?.client.getWindowCount()
  expect(count).toEqual(1)
  done()
});
