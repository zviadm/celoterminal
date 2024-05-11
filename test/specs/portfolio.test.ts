import { checkErrorSnack, selectApp, waitForRefetch } from '../app-helpers'

it('select app', async () => {
	await selectApp("portfolio")
	await waitForRefetch()
	await checkErrorSnack()
})
