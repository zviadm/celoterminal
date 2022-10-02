import * as React from "react";
import { BytesLike } from "ethers";
import { Box } from "@material-ui/core";
import BigNumber from "bignumber.js";
import AppSection from "../../../components/app-section";
import {
	BN,
	ZERO_HASH,
	getMoolaGovernanceDeployBlockNumber,
	moolaGovernanceProposal,
	ProposalSupport,
} from "../moola-helper";
import { ContractKit } from "@celo/contractkit";
import { abi as MoolaGovernorBravoDelegateABI } from "../abi/MoolaGovernorBravoDelegate.json";
import { TXFunc, TXFinishFunc } from "../../../components/app-definition";
import { abi as MooTokenABI } from "../abi/MooToken.json";
import { AbiItem, toTransactionObject } from "@celo/connect";
import useOnChainState from "../../../state/onchain-state";
import { Account } from "../../../../lib/accounts/accounts";

import GovernanceDetails from "./details";
import CreateGovernanceProposal from "./create-proposal";
import GovernanceProposals from "./proposals";

const FETCH_PROPOSAL_COUNT = 10; // displays 10 most recent proposal details

const Governance = ({
	runTXs,
	mooTokenAddress,
	governanceAddress,
	userAddress,
	latestBlockNumber,
	addressBook,
}: {
	governanceAddress: string;
	mooTokenAddress: string;
	userAddress: string;
	latestBlockNumber: number;
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void;
	addressBook: Account[];
}): JSX.Element => {
	const defaultGovernanceDetails = {
		votingPower: BN(0),
		tokenDelegate: ZERO_HASH,
		quorumVotes: BN(0),
		proposalThreshold: BN(0),
	};

	const {
		isFetching: isFetchingDetails,
		fetched: governanceDetails,
		refetch: refetchDetails,
	} = useOnChainState(
		React.useCallback(
			async (kit: ContractKit) => {
				if (governanceAddress === ZERO_HASH) {
					return;
				}

				const governanceContract = new kit.web3.eth.Contract(
					MoolaGovernorBravoDelegateABI as AbiItem[],
					governanceAddress
				);
				const tokenContract = new kit.web3.eth.Contract(
					MooTokenABI as AbiItem[],
					mooTokenAddress
				);

				const votingPower = await tokenContract.methods
					.getPriorVotes(userAddress, latestBlockNumber - 1) // minus one to avoid voting power not yet determined error
					.call();
				const tokenDelegate = await tokenContract.methods
					.delegates(userAddress)
					.call();
				const quorumVotes = await governanceContract.methods
					.quorumVotes()
					.call();
				const proposalThreshold = await governanceContract.methods
					.proposalThreshold()
					.call();

				return {
					votingPower,
					tokenDelegate,
					quorumVotes,
					proposalThreshold,
				};
			},
			[userAddress, governanceAddress, latestBlockNumber, mooTokenAddress]
		)
	);

	const {
		isFetching: isFetchingProposals,
		fetched: proposals,
		refetch: refetchProposals,
	} = useOnChainState(
		React.useCallback(
			async (kit: ContractKit) => {
				if (governanceAddress === ZERO_HASH) {
					return;
				}
				const tokenContract = new kit.web3.eth.Contract(
					MooTokenABI as AbiItem[],
					mooTokenAddress
				);

				const governanceContract = new kit.web3.eth.Contract(
					MoolaGovernorBravoDelegateABI as AbiItem[],
					governanceAddress
				);

				const proposalEvents = await governanceContract.getPastEvents(
					"ProposalCreated",
					{
						fromBlock: getMoolaGovernanceDeployBlockNumber(),
					}
				);
				const recentProposals = proposalEvents
					.reverse()
					.slice(0, FETCH_PROPOSAL_COUNT);
				const proposalIDs = recentProposals.map((e) => e.returnValues.id);

				const proposalDescriptionsAndBlocks = recentProposals.map((e) => ({
					description: e.returnValues.description,
					startBlock: e.returnValues.startBlock,
					endBlock: e.returnValues.endBlock,
				}));

				const proposalInfoPromises = proposalIDs.map((id) =>
					governanceContract.methods.proposals(id).call()
				);
				const proposalInfo = await Promise.all(proposalInfoPromises);

				const proposalStatePromises = proposalIDs.map((id) =>
					governanceContract.methods.state(id).call()
				);
				const proposalStates = await Promise.all(proposalStatePromises);

				const formattedProposals: moolaGovernanceProposal[] = proposalInfo.map(
					({ id, proposer, executed, forVotes, againstVotes, eta }, idx) => {
						const { startBlock, endBlock, description } =
							proposalDescriptionsAndBlocks[idx];
						return {
							id,
							proposer,
							executed,
							forVotes,
							againstVotes,
							startBlock,
							endBlock,
							userVotingPower: BN(0),
							description,
							eta,
							state: parseInt(proposalStates[idx]),
						};
					}
				);

				formattedProposals.forEach(async ({ startBlock }, index) => {
					if (BN(startBlock).gt(BN(latestBlockNumber))) return;

					const userVotingPower = await tokenContract.methods
						.getPriorVotes(userAddress, startBlock)
						.call();
					formattedProposals[index].userVotingPower = userVotingPower;
				});

				return formattedProposals;
			},
			[userAddress, latestBlockNumber, governanceAddress, mooTokenAddress]
		)
	);

	const handleSetDelegateAddress = (address: string) => {
		runTXs(async (kit: ContractKit) => {
			if (governanceAddress === ZERO_HASH) {
				return [];
			}
			const tokenContract = new kit.web3.eth.Contract(
				MooTokenABI as AbiItem[],
				mooTokenAddress
			);

			const tx = toTransactionObject(
				kit.connection,
				tokenContract.methods.delegate(address)
			);

			return [{ tx }];
		}, refetchDetails);
	};

	const handleCastVote = (id: string, support: ProposalSupport) => {
		runTXs(async (kit: ContractKit) => {
			if (governanceAddress === ZERO_HASH) {
				return [];
			}

			const governanceContract = new kit.web3.eth.Contract(
				MoolaGovernorBravoDelegateABI as AbiItem[],
				governanceAddress
			);

			const tx = toTransactionObject(
				kit.connection,
				governanceContract.methods.castVote(id, support)
			);

			return [{ tx }];
		}, refetchProposals);
	};

	const handleCreateProposal = (
		targets: string[],
		values: BigNumber[],
		signatures: string[],
		calldatas: BytesLike[],
		description: string
	) => {
		runTXs(async (kit: ContractKit) => {
			if (governanceAddress === ZERO_HASH) {
				return [];
			}

			const governanceContract = new kit.web3.eth.Contract(
				MoolaGovernorBravoDelegateABI as AbiItem[],
				governanceAddress
			);

			const tx = toTransactionObject(
				kit.connection,
				governanceContract.methods.propose(
					targets,
					values,
					signatures,
					calldatas,
					description
				)
			);

			return [{ tx }];
		}, refetchProposals);
	};

	const handleCancelProposal = (proposalId: string) => {
		runTXs(async (kit: ContractKit) => {
			if (governanceAddress === ZERO_HASH) {
				return [];
			}

			const governanceContract = new kit.web3.eth.Contract(
				MoolaGovernorBravoDelegateABI as AbiItem[],
				governanceAddress
			);

			const tx = toTransactionObject(
				kit.connection,
				governanceContract.methods.cancel(proposalId)
			);

			return [{ tx }];
		}, refetchProposals);
	};

	const handleQueueProposal = (proposalId: string) => {
		runTXs(async (kit: ContractKit) => {
			if (governanceAddress === ZERO_HASH) {
				return [];
			}

			const governanceContract = new kit.web3.eth.Contract(
				MoolaGovernorBravoDelegateABI as AbiItem[],
				governanceAddress
			);

			const tx = toTransactionObject(
				kit.connection,
				governanceContract.methods.queue(proposalId)
			);

			return [{ tx }];
		}, refetchProposals);
	};

	const handleExecuteProposal = (proposalId: string) => {
		runTXs(async (kit: ContractKit) => {
			if (governanceAddress === ZERO_HASH) {
				return [];
			}

			const governanceContract = new kit.web3.eth.Contract(
				MoolaGovernorBravoDelegateABI as AbiItem[],
				governanceAddress
			);

			const tx = toTransactionObject(
				kit.connection,
				governanceContract.methods.execute(proposalId)
			);

			return [{ tx }];
		}, refetchProposals);
	};

	const { votingPower, tokenDelegate, quorumVotes, proposalThreshold } =
		governanceDetails || defaultGovernanceDetails;

	const canCreateProposal = BN(votingPower).gte(proposalThreshold);

	return (
		<Box>
			<AppSection>
				<GovernanceDetails
					addressBook={addressBook}
					isFetching={isFetchingDetails}
					votingPower={votingPower}
					tokenDelegate={tokenDelegate}
					quorumVotes={quorumVotes}
					proposalThreshold={proposalThreshold}
					onSaveDelegateAddress={handleSetDelegateAddress}
				/>
			</AppSection>

			{canCreateProposal && (
				<AppSection>
					<CreateGovernanceProposal onCreateProposal={handleCreateProposal} />
				</AppSection>
			)}
			<AppSection>
				<GovernanceProposals
					votingPower={votingPower}
					onCastVote={handleCastVote}
					userAddress={userAddress}
					onCancelProposal={handleCancelProposal}
					onQueueProposal={handleQueueProposal}
					onExecuteProposal={handleExecuteProposal}
					isFetching={isFetchingProposals}
					proposals={proposals || []}
					latestBlockNumber={latestBlockNumber}
				/>
			</AppSection>
		</Box>
	);
};

export default Governance;
