import * as React from 'react'
import Lock from '@material-ui/icons/Lock'

import { AppDefinition } from "../../components/app-definition"
import LockerApp from "./locker";

export const Locker: AppDefinition = {
	id: "locker",
	title: "Locker",
	icon: <Lock />,
	iconLarge: <Lock fontSize="large" />,
	core: true,
	url: "https://docs.celo.org/celo-codebase/protocol/proof-of-stake/locked-gold",
	renderApp: LockerApp,
}