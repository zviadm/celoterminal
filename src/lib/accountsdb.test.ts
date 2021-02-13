import * as tmp from 'tmp'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { LocalAccount } from './accounts';
import AccountsDB, { decryptLocalKey, encryptLocalKey } from './accountsdb'

tmp.setGracefulCleanup()

test('accountsDB test', () => {
	const tmpobj = tmp.fileSync();
	const db = new AccountsDB(tmpobj.name)
	let accounts = db.readAccounts()
	expect(accounts.length).toEqual(0)

	const pKey0 = "0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d"
	const addr0 = privateKeyToAddress(pKey0)
	db.addAccount({
		type: "address-only",
		name: "test0",
		address: addr0,
	})
	accounts = db.readAccounts()
	expect(accounts.length).toEqual(1)
	expect(accounts[0].name).toEqual('test0')

	const pw = "pw"
	const encryptedKey0 = encryptLocalKey({privateKey: pKey0}, pw)
	expect(() => {
		db.addAccount({
			type: "local",
			name: "test1",
			address: addr0,
			encryptedData: encryptedKey0,
		}, pw)
	}).toThrow("already exists")
	expect(db.hasPassword()).toEqual(false)

	const pKey1 = "0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72"
	const addr1 = privateKeyToAddress(pKey1)
	const encryptedKey1 = encryptLocalKey({privateKey: pKey1}, pw)
	db.addAccount({
		type: "local",
		name: "test1",
		address: addr1,
		encryptedData: encryptedKey1,
	}, pw)
	expect(db.hasPassword()).toEqual(true)

	expect(() => {
		db.changePassword("pw_wrong", "pwnew")
	}).toThrow("does not match")
	db.changePassword("pw", "pwnew")

	const test1 = db.readAccounts().find((a) => a.name === "test1") as LocalAccount
	expect(test1?.type).toEqual("local")
	expect(test1?.address).toEqual(addr1)
	expect(decryptLocalKey(test1.encryptedData, "pwnew").privateKey).toEqual(pKey1)

	db.close()
})