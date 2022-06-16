import * as React from "react";
import {
	Box,
	LinearProgress,
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@material-ui/core";
import SectionTitle from "../../components/section-title";
import { userReserveData } from "./moola-helper";

const UserReserveStatus = ({
	isFetching,
	tokenName,
	userReserveData,
}: {
	isFetching: boolean;
	tokenName: string;
	userReserveData: userReserveData;
}): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<SectionTitle>{tokenName} User Reserve Status</SectionTitle>
			{isFetching ? (
				<LinearProgress />
			) : (
				<Table size="small">
					<TableBody>
						{Object.keys(userReserveData || {}).map((key) => (
							<TableRow key={key}>
								<TableCell>{key}</TableCell>
								<TableCell>
									{userReserveData[key as keyof typeof userReserveData]}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</Box>
	);
};
export default UserReserveStatus;
