import * as React from "react";
import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	LinearProgress,
} from "@material-ui/core";
import SectionTitle from "../../../components/section-title";
import BigNumber from "bignumber.js";
import { toHumanFriendlyWei } from "../moola-helper";

const GovernanceDetails = ({
	isFetching,
	votingPower,
	tokenDelegate,
	quorumVotes,
	proposalThreshold,
}: {
	isFetching: boolean;
	votingPower: BigNumber;
	tokenDelegate: string;
	quorumVotes: BigNumber;
	proposalThreshold: BigNumber;
}): JSX.Element => {
	return (
		<Box>
			{isFetching ? (
				<LinearProgress />
			) : (
				<Box>
					<Box style={{ margin: "15px 0 15px 0" }}>
						<SectionTitle>User Details</SectionTitle>
						<Table size="small">
							<TableBody>
								<TableRow>
									<TableCell>Voting Power</TableCell>
									<TableCell>{toHumanFriendlyWei(votingPower)}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Token Delegate</TableCell>
									<TableCell>{tokenDelegate}</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</Box>
					<Box style={{ margin: "15px 0 15px 0" }}>
						<SectionTitle>Governance Details</SectionTitle>
						<Table size="small">
							<TableBody>
								<TableRow>
									<TableCell>Quorum</TableCell>
									<TableCell>{toHumanFriendlyWei(quorumVotes)} MOO</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Proposal Threshold</TableCell>
									<TableCell>
										{toHumanFriendlyWei(proposalThreshold)} MOO
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default GovernanceDetails;

// TODO: update delegate
