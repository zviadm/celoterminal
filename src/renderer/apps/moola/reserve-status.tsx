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
import { reserveData } from "./moola-helper";

const ReserveStatus = ({
	isFetching,
	reserveData,
	tokenName,
}: {
	isFetching: boolean;
	reserveData: reserveData;
	tokenName: string;
}): JSX.Element => {
	return (
		<Box display="flex" flexDirection="column">
			<SectionTitle>{tokenName} Reserve Status</SectionTitle>
			{isFetching ? (
				<LinearProgress />
			) : (
				<Table size="small">
					<TableBody>
						{Object.keys(reserveData || {}).map((key) => (
							<TableRow key={key}>
								<TableCell>{key}</TableCell>
								<TableCell>
									{reserveData[key as keyof typeof reserveData]}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</Box>
	);
};
export default ReserveStatus;
