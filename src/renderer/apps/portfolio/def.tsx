import * as React from 'react'
import { AppDefinition } from "../../components/app-definition"
import PortfolioApp from "./portfolio"
import icon from './portfolio-icon.png'

export const Portfolio: AppDefinition = {
	id: "portfolio",
	title: "Portfolio",
	icon: <img src={icon} width="24px" />,
	iconLarge: <img src={icon} width="35px" />,
	core: true,
	renderApp: PortfolioApp,
}