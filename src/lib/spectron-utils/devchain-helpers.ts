import { Address, ContractKit } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import { toWei } from "web3-utils"
import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'

// Creates eligable validator group with a single validator as its member.
// Provided `vgroup` and `member` must be non-registered addresses with >10k CELO
// balance.
export const createValidatorGroup = async (
	kit: ContractKit,
	vgroup: Address,
	member: Address,
	): Promise<void> => {

	const accounts = await kit.contracts.getAccounts()
	const lockedGold = await kit.contracts.getLockedGold()
	const validators = await kit.contracts.getValidators()
	await Promise.all([
		accounts.createAccount().sendAndWaitForReceipt({from: vgroup}),
		accounts.createAccount().sendAndWaitForReceipt({from: member}),
	])
	await Promise.all([
		lockedGold.lock().sendAndWaitForReceipt({from: vgroup, value: toWei("10000.1", "ether")}),
		lockedGold.lock().sendAndWaitForReceipt({from: member, value: toWei("10000.1", "ether")}),
	])

	// Random hex strings
	const blsPublicKey =
		'0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00'
	const blsPoP =
		'0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900'
	const ecdsaPublicKey = await addressToPublicKey(member, kit.web3.eth.sign)
	await Promise.all([
		(await validators
			.registerValidatorGroup(new BigNumber(0.5)))
			.sendAndWaitForReceipt({from: vgroup}),
		validators
			.registerValidator(ecdsaPublicKey, blsPublicKey, blsPoP)
			.sendAndWaitForReceipt({from: member}),
	])
	await validators
		.affiliate(vgroup)
		.sendAndWaitForReceipt({from: member})
	await (await validators
		.addMember(vgroup, member))
		.sendAndWaitForReceipt({from: vgroup})
}