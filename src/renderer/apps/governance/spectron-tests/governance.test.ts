import { toWei } from 'web3-utils'

import { app, devchainKit, jestSetup } from '../../../../lib/spectron-utils/setup'
import { adjustNow, confirmTXs, refetchAppData, selectApp } from '../../../../lib/spectron-utils/app-helpers'
import { createGovernanceProposal, dequeueAndApproveProposal } from '../../../../lib/spectron-utils/devchain-helpers'
import { spectronDefaultAccount } from '../../../../lib/spectron-utils/constants'

jestSetup()

test('Governance upvote & vote', async (done) => {
	const kit = devchainKit()
	await createGovernanceProposal(kit)
	await createGovernanceProposal(kit)
	await createGovernanceProposal(kit)

	const accounts = await kit.contracts.getAccounts()
	const lockedGold = await kit.contracts.getLockedGold()
	await accounts.createAccount().sendAndWaitForReceipt({from: spectronDefaultAccount})
	await lockedGold.lock().sendAndWaitForReceipt({from: spectronDefaultAccount, value: toWei("101", "ether")})

	await selectApp("governance")

	const governance = await kit.contracts.getGovernance()

	// Proposal 1 should be automatically dequeued and ready for voting.
	const voteYes1 = await app.client.$("#vote-Yes-1")
	await voteYes1.waitForEnabled()
	await voteYes1.click()
	await confirmTXs()
	const votes1 = await governance.getVotes(1)
	expect(votes1.Yes.toNumber()).toEqual(101e18)
	const isApproved1 = await governance.isApproved(1)
	expect(isApproved1).toEqual(false)

	// Switch upvotes between Proposal 2 & 3.
	const upvote2 = await app.client.$("#upvote-2")
	await upvote2.isEnabled()
	await upvote2.click()
	await confirmTXs()
	const upvotes2 = await governance.getUpvotes(2)
	expect(upvotes2.toNumber()).toEqual(101e18)
	const upvote3 = await app.client.$("#upvote-3")
	await upvote3.isEnabled()
	await upvote3.click()
	await confirmTXs({txCount: 2}) // needs to revoke previous upvote.
	const upvotes2after = await governance.getUpvotes(2)
	expect(upvotes2after.toNumber()).toEqual(0)
	const upvotes3 = await governance.getUpvotes(3)
	expect(upvotes3.toNumber()).toEqual(101e18)

	// Dequeues both Proposal 2 & 3 by advancing time.
	const cfg = await governance.getConfig()
	await adjustNow(cfg.dequeueFrequency.multipliedBy(1000).toNumber())
	await dequeueAndApproveProposal(kit, 2)

	await refetchAppData()
	const voteYes2 = await app.client.$("#vote-Yes-2")
	await voteYes2.waitForEnabled()
	await voteYes2.click()
	await confirmTXs()

	let votes2 = await governance.getVotes(2)
	expect(votes2.Yes.toNumber()).toEqual(101e18)
	const isApproved2 = await governance.isApproved(2)
	expect(isApproved2).toEqual(true)

	const voteNo2 = await app.client.$("#vote-No-2")
	await voteNo2.click()
	await confirmTXs()
	votes2 = await governance.getVotes(2)
	expect(votes2.No.toNumber()).toEqual(101e18)

	const voteAbstein2 = await app.client.$("#vote-Abstain-2")
	await voteAbstein2.click()
	await confirmTXs()
	votes2 = await governance.getVotes(2)
	expect(votes2.Abstain.toNumber()).toEqual(101e18)

	done()
});
