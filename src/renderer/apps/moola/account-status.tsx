import * as React from "react";
import {
	Box,
	LinearProgress,
	Table,
	TableBody,
	TableRow,
	TableCell,
} from "@material-ui/core";
import SectionTitle from "../../components/section-title";
import { userAccountData } from "./moola-helper";

const AccountStatus = ({
	isFetching,
	userAccountData,
}: {
	isFetching: boolean;
	userAccountData: userAccountData;
}): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<SectionTitle>Account Status</SectionTitle>
			{isFetching ? (
				<LinearProgress />
			) : (
				<Table size="small">
					<TableBody>
						{Object.keys(userAccountData || {}).map((key) => (
							<TableRow key={key}>
								<TableCell>{key}</TableCell>
								<TableCell>
									{userAccountData[key as keyof typeof userAccountData]}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</Box>
	);
};
export default AccountStatus;
