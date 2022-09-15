import * as React from "react";
import {
	Box,
	LinearProgress,
	Table,
	TableBody,
	TableRow,
	TableCell,
} from "@material-ui/core";
import SectionTitle from "../../../components/section-title";
import { userAccountData } from "../moola-helper";

const GovernanceProposals = ({
	isFetching,
	proposals,
}: {
	isFetching: boolean;
	proposals: userAccountData;
}): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<SectionTitle>Account Status</SectionTitle>
			{isFetching ? (
				<LinearProgress />
			) : (
				<Table size="small">
					<TableBody>
						<TableRow>
							<TableCell>test</TableCell>
							<TableCell>hello</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			)}
		</Box>
	);
};
export default GovernanceProposals;

// NEXT-- add proposals, 参考 proposal card in romulus
