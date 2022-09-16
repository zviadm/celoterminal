import * as React from "react";
import {
	Box,
	LinearProgress,
	Table,
	TableBody,
	TableRow,
	TableCell,
	Button,
	CardActions,
	CardContent,
	Typography,
	Card,
} from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";
import SectionTitle from "../../../components/section-title";
import {
	moolaGovernanceProposal,
	toHumanFriendlyWei,
	ProposalState,
	ProposalSupport,
	moolaProposalDisplay,
	BN,
} from "../moola-helper";
import BigNumber from "bignumber.js";

const useStyles = makeStyles({
	container: { margin: "20px 0 20px 0" },
	card: {
		marginBottom: 10,
		padding: 10,
	},
	title: {
		fontSize: 15,
		fontWeight: "bold",
		marginBotton: 10,
	},
	bold: {
		fontWeight: "bold",
	},
	pos: {
		marginBottom: 12,
	},
	actionButton: {
		textTransform: "none",
		width: 200,
		marginTop: 10,
		marginRight: 10,
	},
});

const GovernanceProposals = ({
	isFetching,
	proposals,
	votingPower,
	castVote,
}: {
	isFetching: boolean;
	proposals: moolaGovernanceProposal[];
	votingPower: BigNumber;
	castVote: (id: string, support: ProposalSupport) => void;
}): JSX.Element => {
	const classes = useStyles();

	return (
		<Box className={classes.container}>
			<SectionTitle>Governance Proposals</SectionTitle>
			{isFetching ? (
				<LinearProgress />
			) : (
				<div>
					{proposals.map(({ id, proposer, forVotes, againstVotes, state }) => {
						const { stateStr, stateColor } = getProposalDisplay(state);
						const hasVotingPower = BN(votingPower).gt(BN(0));
						const proposalActive = state === ProposalState.ACTIVE;
						const canVote = hasVotingPower && proposalActive;
						return (
							<Card key={`proposal-${id}`} className={classes.card}>
								<CardContent>
									<Typography
										className={classes.title}
									>{`Proposal ${id}`}</Typography>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<div>
											<div>
												{`Proposed By: `}
												<span className={classes.bold}>
													{`${proposer.slice(0, 6)}...${proposer.slice(37)}`}
												</span>
											</div>

											<div>
												{`state: `}
												<span
													className={classes.bold}
													style={{ color: stateColor }}
												>
													{stateStr}
												</span>
											</div>
										</div>
										<div>
											<div>
												{`forVotes: `}{" "}
												<span className={classes.bold}>
													{toHumanFriendlyWei(forVotes)}
												</span>
											</div>
											<div>
												{`againstVotes: `}{" "}
												<span className={classes.bold}>
													{toHumanFriendlyWei(againstVotes)}
												</span>
											</div>
										</div>
									</div>
								</CardContent>
								{!hasVotingPower && (
									<div style={{ marginLeft: 10 }}>
										* You have no voting power for this proposal.
									</div>
								)}
								{canVote && (
									<CardActions style={{ display: "flex" }}>
										<Button
											size="small"
											color="primary"
											onClick={() => castVote(id, ProposalSupport.FOR)}
											className={classes.actionButton}
											variant="contained"
										>
											{`vote for #${id}`}
										</Button>
										<Button
											size="small"
											color="secondary"
											onClick={() => castVote(id, ProposalSupport.AGAINST)}
											className={classes.actionButton}
											variant="contained"
										>
											{`vote against #${id}`}
										</Button>
									</CardActions>
								)}
							</Card>
						);
					})}
				</div>
			)}
		</Box>
	);
};

function getProposalDisplay(state: number): moolaProposalDisplay {
	switch (state) {
		case ProposalState.PENDING:
			// const secondsTilStart =
			//   (Number(latestBlockNumber) -
			//     Number(proposalEvent.args.startBlock.toString())) *
			//   SECONDS_PER_BLOCK;
			return {
				stateStr: "Pending",
				// timeText: `${moment
				//   .duration(secondsTilStart, "seconds")
				//   .humanize()} until voting begins`,
				timeText: "Voting will begin soon",
				stateColor: "#F3841E",
				votingTimeColor: "#F3841E",
			};
		case ProposalState.ACTIVE:
			// const secondsTilEnd =
			//   (Number(proposalEvent.args.endBlock.toString()) -
			//     Number(latestBlockNumber)) *
			//   SECONDS_PER_BLOCK;
			return {
				stateStr: "Active",
				// timeText: `${moment
				//   .duration(secondsTilEnd, "seconds")
				//   .humanize()} until voting ends`,
				timeText: "Voting ongoing",
				stateColor: "#35D07F",
				votingTimeColor: "#35D07F",
			};
		case ProposalState.CANCELED:
			return {
				stateStr: "Canceled",
				timeText: "Voting Ended",
				stateColor: "#909090",
				votingTimeColor: "#909090",
			};
		case ProposalState.DEFEATED:
			return {
				stateStr: "Defeated",
				timeText: "Voting Ended",
				stateColor: "#909090",
				votingTimeColor: "#909090",
			};
		case ProposalState.SUCCEEDED:
			return {
				stateStr: "Succeeded",
				timeText: "Voting Ended",
				stateColor: "#35D07F",
				votingTimeColor: "#909090",
			};
		case ProposalState.QUEUED:
			return {
				stateStr: "Queued",
				timeText: "Voting Ended",
				votingTimeColor: "#909090",
				stateColor: "#909090",
			};
		case ProposalState.EXPIRED:
			return {
				stateStr: "Expired",
				timeText: "Voting Ended",
				stateColor: "#909090",
				votingTimeColor: "#909090",
			};
		case ProposalState.EXECUTED:
			return {
				stateStr: "Executed",
				timeText: "Voting Ended",
				stateColor: "#35D07F",
				votingTimeColor: "#909090",
			};
		default:
			return {
				stateStr: "Unknown",
				timeText: "Unknown",
				stateColor: "#35D07F",
				votingTimeColor: "#909090",
			};
	}
}

export default GovernanceProposals;
