import * as React from 'react'
import Loop from '@material-ui/icons/Loop'

import { AppDefinition } from "../../components/app-definition"
import SwappaApp from "./swappa";

export const Swappa: AppDefinition = {
	id: "swappa",
	title: "Swappa",
	icon: <Loop />,
	iconLarge: <Loop fontSize="large" />,
	// url: "https://docs.celo.org/celo-codebase/protocol/stability",
	description: `
	Swap any cERC20 token for another cERC20 token using the best available
	trading route across all DEXex and DeFI protocols. Supports Ubeswap, Sushiswap,
	Mobius, Moola, SavingsCELO, and other protocols.
	`,
	renderApp: SwappaApp,
}