import { Application } from 'spectron'

import { sleep } from '../../../../lib/utils'
import { startApp } from '../../../../lib/spectron-utils/setup'
import { confirmTXs } from '../../../../lib/spectron-utils/tx-runner'

let app: Application
beforeAll(async () => {
  app = await startApp()
})
afterAll(async () => {
  if (app && app.isRunning()) {
    await app.stop()
  }
	return
})

test('Create account', async (done) => {
  const menuLocker = await app.client.$("#menu-locker")
  await menuLocker.waitForExist()
  await menuLocker.click()

  const createAccount = await app.client.$("#create-account")
  await createAccount.waitForExist()
  await createAccount.click()

  await confirmTXs(app.client)
  done()
});
