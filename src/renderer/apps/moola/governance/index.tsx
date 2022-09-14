import * as React from "react";
import { Box, Button, Select, MenuItem, InputLabel } from "@material-ui/core";
import NumberInput from "../../../components/number-input";
import BigNumber from "bignumber.js";
import { availableRateMode } from "../config";
import { BN, toBigNumberWei, ZERO_HASH } from "../moola-helper";
import Web3 from "web3";
import { abi as MoolaGovernorBravoDelegateABI } from "./abi/MoolaGovernorBravoDelegateABI";
import { abi as MooTokenABI } from "./abi/MooTokenABI";
import {
	AbiItem,
	toTransactionObject,
	CeloTransactionObject,
} from "@celo/connect";

import GovernanceDetails from "./details";

const Governance = ({
	web3,
	mooTokenAddress,
	governanceAddress,
	userAddress,
}: {
	governanceAddress: string;
	mooTokenAddress: string;
	userAddress: string;
	web3: Web3;
}): JSX.Element => {
	const defaultGovernanceDetails = {
		votingPower: BN(0),
		tokenDelegate: ZERO_HASH,
		quorumVotes: BN(0),
		proposalThreshold: BN(0),
	};
	const [isFetching, setFetching] = React.useState(true);
	const [governanceDetails, setGovernanceDetails] = React.useState(
		defaultGovernanceDetails
	);

	React.useEffect(() => {
		async function getGovernanceDetails() {
			const latestBlockNumber = await web3.eth.getBlockNumber();
			const governanceContract = new web3.eth.Contract(
				MoolaGovernorBravoDelegateABI as AbiItem[],
				governanceAddress
			);
			const tokenContract = new web3.eth.Contract(
				MooTokenABI as AbiItem[],
				mooTokenAddress
			);

			const votingPower = tokenContract.methods.getPriorVotes(
				userAddress,
				latestBlockNumber
			);
			const tokenDelegate = await tokenContract.methods.delegates(userAddress);
			const quorumVotes = await governanceContract.methods.quorumVotes();
			const proposalThreshold =
				await governanceContract.methods.proposalThreshold();

			setFetching(false);
			setGovernanceDetails({
				votingPower,
				tokenDelegate,
				quorumVotes,
				proposalThreshold,
			});
		}

		getGovernanceDetails();
	}, [governanceAddress, mooTokenAddress, web3, userAddress]);

	const { votingPower, tokenDelegate, quorumVotes, proposalThreshold } =
		governanceDetails;

	return (
		<Box display="flex" flexDirection="column">
			<GovernanceDetails
				isFetching={isFetching}
				votingPower={votingPower}
				tokenDelegate={tokenDelegate}
				quorumVotes={quorumVotes}
				proposalThreshold={proposalThreshold}
			/>
		</Box>
	);
};
export default Governance;
