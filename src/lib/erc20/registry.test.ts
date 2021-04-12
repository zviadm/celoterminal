import { ensureLeading0x, toChecksumAddress } from '@celo/utils/lib/address'
import { isValidAddress } from 'ethereumjs-util'

import { erc20Registry } from "./registry"

test('sanity check registry constants', () => {
	for (const erc20s of [erc20Registry]) {
		const symbolSet = new Set<string>()
		const addrSet = new Set<string>()
		erc20s.forEach((e) => {
			Object.values(e.addresses).forEach((addr) => {
				if (!addr) {
					return
				}
				const normalizedAddr = ensureLeading0x(toChecksumAddress(addr))
				expect(addr).toEqual(normalizedAddr)
				expect(isValidAddress(addr)).toEqual(true)
			})
			symbolSet.add(e.symbol)
		})

		expect(erc20s.length).toEqual(symbolSet.size)
		expect(erc20s.length).toEqual(addrSet.size)
	}
})