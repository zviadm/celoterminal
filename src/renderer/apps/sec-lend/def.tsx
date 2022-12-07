import * as React from "react";
import { AppDefinition } from "../../components/app-definition";
import SecLendApp from "./sec-lend";
import icon from "./sec-lend-icon.png";

export const SecLend: AppDefinition = {
	id: "sec-lend",
	title: "SecLend",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	url: "",
	description: `SecLend`,
	renderApp: SecLendApp,
};
