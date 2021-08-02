import * as React from 'react'
import {ReactComponent as MultisendIcon} from "./icon.svg"

import { AppDefinition } from "../../components/app-definition"
import MultiSendApp from "./multisend"
import SvgIcon from '@material-ui/core/SvgIcon';

const CVIcon = (props: {fontSize?: "default" | "large"}): JSX.Element => {
	return <SvgIcon
		fontSize={props.fontSize}
		component={MultisendIcon}
		/>
}

export const MultiSend: AppDefinition = {
	id: "multisend",
	title: "MultiSend",
	icon: <CVIcon />,
	iconLarge: <CVIcon fontSize="large" />,
	core: true,
	description: "App to disburse payments to multiple accounts.", 
	renderApp: MultiSendApp,
}
