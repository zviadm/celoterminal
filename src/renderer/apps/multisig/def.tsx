import { Group } from '@material-ui/icons';

import { AppDefinition } from "../../components/app-definition"
import MultiSigApp from "./multisig"

export const MultiSig: AppDefinition = {
	id: "multisig",
	title: "MultiSig",
	icon: Group,
	url: "https://github.com/zviadm/celoterminal/wiki/Using-MultiSig-accounts",
	description: `
	Manage MultiSig accounts. Confirm transactions, add/remove owners,
	change signature requirements and more.
	`,
	renderApp: MultiSigApp,
}
