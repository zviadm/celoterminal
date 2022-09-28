import * as React from "react";
import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	LinearProgress,
	Button,
} from "@material-ui/core";
import BigNumber from "bignumber.js";
import { toHumanFriendlyWei } from "../moola-helper";
import { Account } from "../../../../lib/accounts/accounts";
import SectionTitle from "../../../components/section-title";
import AddressAutocomplete from "../../../components/address-autocomplete";

const GovernanceDetails = ({
	isFetching,
	votingPower,
	tokenDelegate,
	quorumVotes,
	proposalThreshold,
	addressBook,
	onSaveDelegateAddress,
}: {
	isFetching: boolean;
	votingPower: BigNumber;
	tokenDelegate: string;
	quorumVotes: BigNumber;
	proposalThreshold: BigNumber;
	addressBook: Account[];
	onSaveDelegateAddress: (address: string) => void;
}): JSX.Element => {
	const [changingDelegate, setChangingDelegate] = React.useState(false);
	const [delegateAddress, setDelegateAddress] = React.useState("");

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
									<TableCell>
										{changingDelegate ? (
											<div>
												<AddressAutocomplete
													id="gov-delegate-input"
													textFieldProps={{
														margin: "normal",
														InputLabelProps: { shrink: true },
													}}
													addresses={addressBook}
													address={delegateAddress}
													onChange={setDelegateAddress}
												/>
											</div>
										) : (
											tokenDelegate
										)}
									</TableCell>
									{changingDelegate ? (
										<Button
											size="small"
											variant="contained"
											onClick={() => {
												onSaveDelegateAddress(delegateAddress);
												setChangingDelegate(false);
											}}
											style={{ marginTop: 20 }}
										>
											Save
										</Button>
									) : (
										<Button
											onClick={() => setChangingDelegate(!changingDelegate)}
											size="small"
											variant="contained"
										>
											Change
										</Button>
									)}
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
