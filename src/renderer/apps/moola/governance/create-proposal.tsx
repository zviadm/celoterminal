import * as React from "react";
import { BytesLike } from "ethers";
import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	LinearProgress,
	TextField,
	Button,
} from "@material-ui/core";
import SectionTitle from "../../../components/section-title";
import BigNumber from "bignumber.js";
import { toHumanFriendlyWei, BN } from "../moola-helper";

const createProposal = ({
	onCreateProposal,
}: {
	onCreateProposal: (
		targets: string[],
		values: BigNumber[],
		signatures: string[],
		calldatas: BytesLike[],
		description: string
	) => void;
}): JSX.Element => {
	const [targets, setTargets] = React.useState<string>("");
	const [values, setValues] = React.useState<string>("");
	const [signatures, setSignatures] = React.useState<string>("");
	const [calldatas, setCalldatas] = React.useState<string>("");
	const [description, setDescription] = React.useState<string>("");

	const handleSubmit = () => {
		const targetsArr = targets.split(",");
		const valuesArr = values.split(",").map((v) => BN(v));
		const signaturesArr = signatures.split(",");
		const calldatasArr = calldatas.split(",");

		onCreateProposal(
			targetsArr,
			valuesArr,
			signaturesArr,
			calldatasArr,
			description
		);
	};

	const inputFields = {
		"targets (address[])": {
			func: setTargets,
			value: targets,
		},
		"values (uint256[])": {
			func: setValues,
			value: values,
		},
		"signatures (string[])": {
			func: setSignatures,
			value: signatures,
		},
		"calldatas (bytes[])": {
			func: setCalldatas,
			value: calldatas,
		},
		"description (string)": {
			func: setDescription,
			value: description,
		},
	};

	return (
		<Box>
			<SectionTitle>Create Governance Proposal</SectionTitle>
			{Object.entries(inputFields).map(([label, data]) => {
				const { func, value } = data;
				return (
					<TextField
						key={label}
						label={label}
						InputLabelProps={{ shrink: true }}
						size="medium"
						fullWidth={true}
						spellCheck={false}
						inputProps={{
							spellCheck: false,
							style: { fontFamily: "monospace" },
						}}
						margin="dense"
						style={{ marginBottom: 10 }}
						value={value}
						onChange={(event) => {
							func(event.target.value);
						}}
					/>
				);
			})}

			<div style={{ textAlign: "right" }}>
				<Button
					color="primary"
					onClick={handleSubmit}
					style={{ textTransform: "none", width: 150, marginTop: 30 }}
					variant="contained"
				>
					Create Proposal
				</Button>
			</div>
		</Box>
	);
};

export default createProposal;
