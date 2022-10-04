import * as React from "react";
import { AppDefinition } from "../../components/app-definition";
import MoolaSecLendApp from "./moola-sec-lend";
import icon from "./moola-sec-lend-icon.png";

export const MoolaSecLend: AppDefinition = {
	id: "moola-sec-lend",
	title: "Moola Market (sec lend)",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	url: "",
	description: `A stock lending market`,
	renderApp: MoolaSecLendApp,
};
