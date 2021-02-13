import { jestSetup } from '../../../../lib/spectron-utils/setup'
import { installOptionalApp } from '../../../../lib/spectron-utils/helpers'

jestSetup()

test('Trade CELO <-> cUSD', async (done) => {
	await installOptionalApp("mento")
	// TODO(zviad): test actual trading.

	done()
});
