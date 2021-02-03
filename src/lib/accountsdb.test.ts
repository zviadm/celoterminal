import * as tmp from 'tmp'
import { LocalAccount } from './accounts';
import AccountsDB, { decryptLocalKey, encryptLocalKey, LocalKey } from './accountsdb'

test('accountsDB test', () => {
	const tmpobj = tmp.fileSync();
	const db = new AccountsDB(tmpobj.name)
	let accounts = db.readAccounts()
	expect(accounts.length).toEqual(0)
	db.addAccount({
		type: "address-only",
		name: "test0",
		address: "0x000100020003000400050006000700080009000a",
	})
	accounts = db.readAccounts()
	expect(accounts.length).toEqual(1)
	expect(accounts[0].name).toEqual('test0')

	const pw = "pw"
	const key: LocalKey = {privateKey: "0000"}
	const encryptedKey = encryptLocalKey(key, pw)
	expect(() => {
		db.addAccount({
			type: "local",
			name: "test1",
			address: "0x000100020003000400050006000700080009000a",
			encryptedData: encryptedKey,
		}, pw)
	}).toThrow("already exists")
	expect(db.hasPassword()).toEqual(false)

	db.addAccount({
		type: "local",
		name: "test1",
		address: "0x0001000200030004000500060007000800090000",
		encryptedData: encryptedKey,
	}, pw)
	expect(db.hasPassword()).toEqual(true)

	expect(() => {
		db.changePassword("pw_wrong", "pwnew")
	}).toThrow("does not match")
	db.changePassword("pw", "pwnew")

	const test1 = db.readAccounts().find((a) => a.name === "test1") as LocalAccount
	expect(test1?.type).toEqual("local")
	expect(test1?.address).toEqual("0x0001000200030004000500060007000800090000")
	expect(decryptLocalKey(test1.encryptedData, "pwnew").privateKey).toEqual(key.privateKey)

	db.close()
	tmpobj.removeCallback()
})