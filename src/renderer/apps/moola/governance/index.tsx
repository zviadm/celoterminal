import * as React from "react";
import { Box, Button, Select, MenuItem, InputLabel } from "@material-ui/core";
import NumberInput from "../../../components/number-input";
import BigNumber from "bignumber.js";
import { availableRateMode } from "../config";
import { BN, toBigNumberWei, ZERO_HASH } from "../moola-helper";
import Web3 from "web3";
import { CeloTokenType, ContractKit } from "@celo/contractkit";
import { abi as MoolaGovernorBravoDelegateABI } from "../abi/MoolaGovernorBravoDelegate.json";
import { TXFunc, TXFinishFunc } from "../../../components/app-definition";
import { abi as MooTokenABI } from "../abi/MooToken.json";
import {
	AbiItem,
	toTransactionObject,
	CeloTransactionObject,
} from "@celo/connect";

import GovernanceDetails from "./details";
import GovernanceProposals from "./proposals";

const Governance = ({
	// web3,
	runTXs,
	mooTokenAddress,
	governanceAddress,
	userAddress,
}: {
	governanceAddress: string;
	mooTokenAddress: string;
	userAddress: string;
	// web3: Web3;
	runTXs: (f: TXFunc, onFinish?: TXFinishFunc) => void;
}): JSX.Element => {
	const defaultGovernanceDetails = {
		votingPower: BN(0),
		tokenDelegate: ZERO_HASH,
		quorumVotes: BN(0),
		proposalThreshold: BN(0),
	};
	const [isFetchingDetails, setFetchingDetails] = React.useState(true);
	const [isFetchingProposals, setFetchingProposals] = React.useState(true);
	const [governanceDetails, setGovernanceDetails] = React.useState(
		defaultGovernanceDetails
	);
	const [proposals, setProposals] = React.useState([]);

	// props.runTXs(
	// 	async (kit: ContractKit) => {
	// 		if (isFetching || !userOnchainState.fetched) return [];

	// 		const LendingPool = new kit.web3.eth.Contract(
	// 			LendingPoolABI as AbiItem[],
	// 			lendingPoolAddress
	// 		);

	// 		const tx = toTransactionObject(
	// 			kit.connection,
	// 			LendingPool.methods.withdraw(tokenAddress, amount, account.address)
	// 		);

	// 		return [{ tx }];
	// 	},
	// 	() => {
	// 		userOnchainState.refetch();
	// 	}
	// );

	React.useEffect(() => {
		async function fetchGovernanceDetails() {
			runTXs(
				async (kit: ContractKit) => {
					const latestBlockNumber = await kit.web3.eth.getBlockNumber();
					// const governanceContract = new web3.eth.Contract(
					// 	MoolaGovernorBravoDelegateABI as AbiItem[],
					// 	governanceAddress
					// );
					// const tokenContract = new web3.eth.Contract(
					// 	MooTokenABI as AbiItem[],
					// 	mooTokenAddress
					// );

					// const votingPower = tokenContract.methods.getPriorVotes(
					// 	userAddress,
					// 	latestBlockNumber
					// );
					// const tokenDelegate = await tokenContract.methods.delegates(
					// 	userAddress
					// );
					// const quorumVotes = await governanceContract.methods.quorumVotes();
					// const proposalThreshold =
					// 	await governanceContract.methods.proposalThreshold();

					// setFetchingDetails(false);
					// setGovernanceDetails({
					// 	votingPower,
					// 	tokenDelegate,
					// 	quorumVotes,
					// 	proposalThreshold,
					// });
					console.log("latestBlockNumber :>> ", latestBlockNumber);
					return [];
				},
				() => {}
			);
		}

		fetchGovernanceDetails();
	}, [governanceAddress, mooTokenAddress, userAddress]);

	// React.useEffect(() => {
	// 	async function fetchProposals() {
	// 		const governanceContract = new web3.eth.Contract(
	// 			MoolaGovernorBravoDelegateABI as AbiItem[],
	// 			governanceAddress
	// 		);

	// 		const proposalEvents = (
	// 			await governanceContract.getPastEvents("ProposalCreated")
	// 		).slice(0, 5);

	// 		setProposals(proposalEvents);
	// 		setFetchingProposals(false);
	// 	}
	// });

	const { votingPower, tokenDelegate, quorumVotes, proposalThreshold } =
		governanceDetails;

	console.log("proposalEvents :>> ", proposals);

	return (
		<Box display="flex" flexDirection="column">
			<GovernanceDetails
				isFetching={isFetchingDetails}
				votingPower={votingPower}
				tokenDelegate={tokenDelegate}
				quorumVotes={quorumVotes}
				proposalThreshold={proposalThreshold}
			/>
			{/* <GovernanceProposals
				isFetching={isFetchingProposals}
				proposals={proposals}
			/> */}
		</Box>
	);
};
export default Governance;
