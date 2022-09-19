import * as React from "react";
import { BytesLike } from "ethers";
import { Box, Button, Select, MenuItem, InputLabel } from "@material-ui/core";
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

import GovernanceDetails from "./details";
import CreateGovernanceProposal from "./create-proposal";
import GovernanceProposals from "./proposals";

const Governance = ({
	runTXs,
	mooTokenAddress,
	governanceAddress,
	userAddress,
}: {
	governanceAddress: string;
	mooTokenAddress: string;
	userAddress: string;
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void;
}): JSX.Element => {
	const defaultGovernanceDetails = {
		votingPower: BN(0),
		tokenDelegate: ZERO_HASH,
		quorumVotes: BN(0),
		proposalThreshold: BN(0),
	};

	const { isFetching: isFetchingDetails, fetched: governanceDetails } =
		useOnChainState(
			React.useCallback(
				async (kit: ContractKit) => {
					if (governanceAddress === ZERO_HASH) {
						return;
					}
					const latestBlockNumber = await kit.web3.eth.getBlockNumber();

					const governanceContract = new kit.web3.eth.Contract(
						MoolaGovernorBravoDelegateABI as AbiItem[],
						governanceAddress
					);
					const tokenContract = new kit.web3.eth.Contract(
						MooTokenABI as AbiItem[],
						mooTokenAddress
					);

					const votingPower = await tokenContract.methods
						.getPriorVotes(userAddress, latestBlockNumber - 1)
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
				[userAddress, governanceAddress]
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
				const proposalIDs = proposalEvents
					.reverse()
					.slice(0, 3)
					.map((e) => e.returnValues.id);

				const proposalInfoPromises = proposalIDs.map((id) =>
					governanceContract.methods.proposals(id).call()
				);
				const proposalInfo = await Promise.all(proposalInfoPromises);

				const proposalStatePromises = proposalIDs.map((id) =>
					governanceContract.methods.state(id).call()
				);
				const proposalStates = await Promise.all(proposalStatePromises);

				const formattedProposals: moolaGovernanceProposal[] = proposalInfo.map(
					(
						{ id, proposer, executed, forVotes, againstVotes, startBlock },
						idx
					) => {
						return {
							id,
							proposer,
							executed,
							forVotes,
							againstVotes,
							startBlock,
							userVotingPower: BN(0),
							state: parseInt(proposalStates[idx]),
						};
					}
				);

				formattedProposals.forEach(async ({ startBlock }, index) => {
					const userVotingPower = await tokenContract.methods
						.getPriorVotes(userAddress, startBlock)
						.call();
					formattedProposals[index].userVotingPower = userVotingPower;
				});

				return formattedProposals;
			},
			[userAddress, governanceAddress]
		)
	);

	const castVote = (id: string, support: ProposalSupport) => {
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

	const { votingPower, tokenDelegate, quorumVotes, proposalThreshold } =
		governanceDetails || defaultGovernanceDetails;

	const canCreateProposal = BN(votingPower).gte(proposalThreshold);
	return (
		<Box>
			<AppSection>
				<GovernanceDetails
					isFetching={isFetchingDetails}
					votingPower={votingPower}
					tokenDelegate={tokenDelegate}
					quorumVotes={quorumVotes}
					proposalThreshold={proposalThreshold}
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
					castVote={castVote}
					isFetching={isFetchingProposals}
					proposals={proposals || []}
				/>
			</AppSection>
		</Box>
	);
};

export default Governance;