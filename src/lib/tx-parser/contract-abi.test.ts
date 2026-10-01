import { abiFromSourcify, sourcifyContractURL } from "./contract-abi"

test("sourcify v2 url", () => {
	expect(sourcifyContractURL("42220", "0x313bc86D3D6e86ba164B2B451cB0D9CfA7943e5c"))
		.toEqual("https://sourcify.dev/server/v2/contract/42220/0x313bc86D3D6e86ba164B2B451cB0D9CfA7943e5c?fields=abi")
})

test("sourcify 404 is not an abi", () => {
	expect(abiFromSourcify(404, {error: "not found"})).toBeUndefined()
	expect(abiFromSourcify(200, {abi: [{type: "function", name: "execute"}]})).toHaveLength(1)
})
