import * as React from 'react'
import {ReactComponent as CelovoteIcon} from "./icon.svg"

import { AppDefinition } from "../../components/app-definition"
import CelovoteApp from "./celovote";
import SvgIcon from '@material-ui/core/SvgIcon';

export const Celovote: AppDefinition = {
	id: "celovote",
	title: "Celovote",
	icon: icon,
	url: "https://celovote.com",
	description: `
	Setup your account to automatically vote with your locked CELO
	to maximize staking returns and minimize risk.
	`,
	renderApp: CelovoteApp,
}

function icon <T>(props: T): JSX.Element {
	return <SvgIcon
		{...props}
		viewBox="0 0 500 400"
		component={CelovoteIcon}
		style={{paddingLeft: 5}}
		/>
}