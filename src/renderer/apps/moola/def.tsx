import * as React from "react";
import { AppDefinition } from "../../components/app-definition";
import MoolaApp from "./moola";
import icon from "./moola-icon.png";

export const Moola: AppDefinition = {
	id: "moola",
	title: "Moola",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	url: "https://docs.celo.org/celo-codebase/protocol/stability",
	description: `Moola APP update later#TODO--`,
	renderApp: MoolaApp,
};
