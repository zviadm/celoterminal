import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import LockerApp from "./locker";
import icon from './locker-icon.png'

export const Locker: AppDefinition = {
	id: "locker",
	title: "Locker",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	core: true,
	url: "https://docs.celo.org/celo-codebase/protocol/proof-of-stake/locked-gold",
	renderApp: LockerApp,
}