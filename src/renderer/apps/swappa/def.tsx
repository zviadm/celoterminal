import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import SwappaApp from "./swappa";
import icon from "./swappa-icon.png"

export const Swappa: AppDefinition = {
	id: "swappa",
	title: "Swappa",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	url: "https://github.com/terminal-fi/swappa#readme",
	description: `
	Swap any cERC20 token for another cERC20 token using the best available
	trading route across all DEXex and DeFI protocols. Supports Ubeswap, Sushiswap,
	Mobius, Moola, and other protocols.
	`,
	renderApp: SwappaApp,
}