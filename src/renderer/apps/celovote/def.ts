import StarsIcon from '@material-ui/icons/Stars'

import { AppDefinition } from "../../components/app-definition"
import CelovoteApp from "./celovote";

export const Celovote: AppDefinition = {
	id: "celovote",
	title: "Celovote",
	icon: StarsIcon,
	url: "https://celovote.com",
	description: `
	Setup your account to automatically vote with your locked CELO
	to maximize staking returns and minimize risk.
	`,
	renderApp: CelovoteApp,
}