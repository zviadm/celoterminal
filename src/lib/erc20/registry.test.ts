import { ensureLeading0x, toChecksumAddress } from '@celo/utils/lib/address'
import { isValidAddress } from 'ethereumjs-util'

import { erc20Alfajores } from "./registry-alfajores"
import { erc20Baklava } from "./registry-baklava"
import { erc20Mainnet } from "./registry-mainnet"

test('sanity check registry constants', () => {
	for (const erc20s of [erc20Alfajores, erc20Baklava, erc20Mainnet]) {
		const symbolSet = new Set<string>()
		const addrSet = new Set<string>()
		erc20s.forEach((e) => {
			if (!e.address) {
				fail("address must be set!")
			}
			const normalizedAddr = ensureLeading0x(toChecksumAddress(e.address))
			expect(e.address).toEqual(normalizedAddr)
			expect(isValidAddress(e.address)).toEqual(true)

			symbolSet.add(e.symbol)
			addrSet.add(e.address)
		})

		expect(erc20s.length).toEqual(symbolSet.size)
		expect(erc20s.length).toEqual(addrSet.size)
	}
})