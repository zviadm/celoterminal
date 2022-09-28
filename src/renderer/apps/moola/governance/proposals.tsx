import * as React from "react";
import {
	Box,
	LinearProgress,
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
	CAN_CANCEL_PROPOSAL_STATES,
	toHumanFriendlyWei,
	ProposalState,
	ProposalSupport,
	moolaProposalDisplay,
	BN,
	parsedMoolaGovernanceProposalDescription,
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
	onCastVote,
	latestBlockNumber,
	userAddress,
	onCancelProposal,
	onQueueProposal,
	onExecuteProposal,
}: {
	isFetching: boolean;
	proposals: moolaGovernanceProposal[];
	votingPower: BigNumber;
	onCastVote: (id: string, support: ProposalSupport) => void;
	onCancelProposal: (id: string) => void;
	onQueueProposal: (id: string) => void;
	onExecuteProposal: (id: string) => void;
	latestBlockNumber: number;
	userAddress: string;
}): JSX.Element => {
	const classes = useStyles();

	return (
		<Box className={classes.container}>
			<SectionTitle>Recent proposals</SectionTitle>
			{isFetching ? (
				<LinearProgress />
			) : (
				<div>
					{proposals.map(
						({
							id,
							proposer,
							forVotes,
							againstVotes,
							state,
							description,
							startBlock,
							endBlock,
							eta,
						}) => {
							const { stateStr, stateColor, timeText } = getProposalDisplay(
								state,
								latestBlockNumber,
								startBlock,
								endBlock
							);
							const hasVotingPower = BN(votingPower).gt(BN(0));
							const proposalActive = state === ProposalState.ACTIVE;
							const canVote = hasVotingPower && proposalActive;
							const canQueueProposal = state === ProposalState.SUCCEEDED;

							const hasPassedTimelock = eta
								? BN(Date.now()).isGreaterThan(BN(eta).multipliedBy(1000))
								: true;
							const canExecuteProposal =
								state === ProposalState.QUEUED && hasPassedTimelock;
							const {
								title: parsedDescriptionTitle,
								description: parsedDescriptionContent,
							} = parseDescription(description);

							/**
							 * A proposal is eligible to be cancelled at any time prior to its execution, including while queued in the Timelock, using this function.
							 * The cancel function on the contract can be called by any address,
							 * if the proposal creator fails to maintain more delegated votes than the proposal threshold.
							 * But here the cancel button is only displayed for the proposor.
							 */
							const canCancelProposal =
								proposer === userAddress &&
								CAN_CANCEL_PROPOSAL_STATES.includes(state);

							return (
								<Card key={`proposal-${id}`} className={classes.card}>
									<CardContent>
										<Typography
											className={classes.title}
										>{`Proposal ${id}`}</Typography>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
											}}
										>
											<div>
												<div>
													{`Proposed By: `}
													<span className={classes.bold}>{proposer}</span>
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
											<div
												style={{
													textAlign: "right",
													border: "2px dashed lightgrey",
													padding: 10,
												}}
											>
												<div>
													{`For Votes: `}
													<span className={classes.bold}>
														{toHumanFriendlyWei(forVotes)}
													</span>
												</div>
												<div>
													{`Against Votes: `}
													<span className={classes.bold}>
														{toHumanFriendlyWei(againstVotes)}
													</span>
												</div>
											</div>
										</div>
										<div>
											{parsedDescriptionTitle && (
												<div
													style={{ fontWeight: "bold", marginBottom: 5 }}
												>{`${parsedDescriptionTitle}`}</div>
											)}
											<div>{parsedDescriptionContent}</div>
										</div>

										<div
											style={{
												marginTop: 20,
												color: "#3488ec",
												fontWeight: "bold",
											}}
										>
											{timeText}
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
												onClick={() => onCastVote(id, ProposalSupport.FOR)}
												className={classes.actionButton}
												variant="contained"
											>
												{`vote for #${id}`}
											</Button>
											<Button
												size="small"
												color="secondary"
												onClick={() => onCastVote(id, ProposalSupport.AGAINST)}
												className={classes.actionButton}
												variant="contained"
											>
												{`vote against #${id}`}
											</Button>
										</CardActions>
									)}
									{canCancelProposal && (
										<CardActions>
											<Button
												size="small"
												color="secondary"
												onClick={() => onCancelProposal(id)}
												className={classes.actionButton}
												variant="contained"
											>
												{`Cancel Proposal #${id}`}
											</Button>
										</CardActions>
									)}
									{canQueueProposal && (
										<CardActions>
											<Button
												size="small"
												color="primary"
												onClick={() => onQueueProposal(id)}
												className={classes.actionButton}
												variant="contained"
											>
												{`Queue Proposal #${id}`}
											</Button>
										</CardActions>
									)}
									{canExecuteProposal && (
										<CardActions>
											<Button
												size="small"
												color="primary"
												onClick={() => onExecuteProposal(id)}
												className={classes.actionButton}
												variant="contained"
											>
												{`Execute Proposal #${id}`}
											</Button>
										</CardActions>
									)}
								</Card>
							);
						}
					)}
				</div>
			)}
		</Box>
	);
};

function getProposalDisplay(
	state: number,
	latestBlockNumber: number,
	startBlock: string,
	endBlock: string
): moolaProposalDisplay {
	let blocksTilStart = 0;
	let blocksTilEnd = 0;
	switch (state) {
		case ProposalState.PENDING:
			blocksTilStart = Number(startBlock) - Number(latestBlockNumber);
			return {
				stateStr: "Pending",
				timeText:
					latestBlockNumber && blocksTilStart >= 0
						? `${blocksTilStart} blocks until voting begins`
						: `Voting will begin soon`,
				stateColor: "#F3841E",
				votingTimeColor: "#F3841E",
			};
		case ProposalState.ACTIVE:
			blocksTilEnd = Number(endBlock) - Number(latestBlockNumber);
			return {
				stateStr: "Active",
				timeText:
					latestBlockNumber && blocksTilEnd >= 0
						? `${blocksTilEnd} blocks until voting ends`
						: `Voting ongoing`,
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

function parseDescription(
	description: string
): parsedMoolaGovernanceProposalDescription {
	const parsed = { title: "", description: "" };

	try {
		const { title: parsedTitle, description: parseddescription } =
			JSON.parse(description);
		parsed.title = parsedTitle;
		parsed.description = parseddescription;
	} catch (e) {
		console.error("Proposal description not in correct parsable format");
		parsed.description = description;
	}

	return parsed;
}

export default GovernanceProposals;
