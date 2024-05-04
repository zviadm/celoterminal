import * as React from 'react'
// import {ReactComponent as CelovoteIcon} from "./icon.svg"

import { AppDefinition } from "../../components/app-definition"
import CelovoteApp from "./celovote";
// import SvgIcon from '@material-ui/core/SvgIcon';
import FindInPage from '@material-ui/icons/FindInPage';

// TODO: N18-MIGRATION
// const CVIcon = (props: {fontSize?: "default" | "large"}): JSX.Element => {
// 	return <SvgIcon
// 		fontSize={props.fontSize}
// 		viewBox="0 0 397 391"
// 		component={CelovoteIcon}
// 		/>
// }

export const Celovote: AppDefinition = {
	id: "celovote",
	title: "Celovote",
	icon: <FindInPage />,
	iconLarge: <FindInPage fontSize="large" />,
	// icon: <CVIcon />,
	// iconLarge: <CVIcon fontSize="large" />,
	url: "https://celovote.com",
	description: `
	Setup your account to automatically vote with your locked CELO
	to maximize staking returns and minimize risk.
	`,
	renderApp: CelovoteApp,
}
