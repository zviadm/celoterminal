import { jestSetup } from '../../../../lib/spectron-utils/setup'
import { selectApp } from '../../../../lib/spectron-utils/app-helpers'

jestSetup()

test('select app', async (done) => {
	await selectApp("portfolio")
	done()
})
