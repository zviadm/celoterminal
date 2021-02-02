import Lock from '@material-ui/icons/Lock'

import { AppDefinition } from "../../components/app-definition"
import LockerApp from "./locker";

export const Locker: AppDefinition = {
	name: "Locker",
	icon: Lock,
	renderApp: LockerApp,
}