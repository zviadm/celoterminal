import * as React from 'react'
import swappaIcon from "./swappa-icon.png"

import { AppDefinition } from "../../components/app-definition"
import SwappaApp from "./swappa";

export const Swappa: AppDefinition = {
	id: "swappa",
	title: "Swappa",
	icon: <img src={swappaIcon} width="24px" />,
	iconLarge: <img src={swappaIcon} width="35px" />,
	url: "https://github.com/terminal-fi/swappa#readme",
	description: `
	Swap any cERC20 token for another cERC20 token using the best available
	trading route across all DEXex and DeFI protocols. Supports Ubeswap, Sushiswap,
	Mobius, Moola, SavingsCELO, and other protocols.
	`,
	renderApp: SwappaApp,
}