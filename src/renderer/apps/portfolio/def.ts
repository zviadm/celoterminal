import { TrendingUp } from '@material-ui/icons'

import { AppDefinition } from "../../components/app-definition"
import PortfolioApp from "./portfolio"

export const Portfolio: AppDefinition = {
	id: "portfolio",
	title: "Portfolio",
	icon: TrendingUp,
	core: true,
	renderApp: PortfolioApp,
}