import * as React from 'react'
// import {ReactComponent as WalletConnectIcon} from "./icon.svg"

import { AppDefinition } from "../../components/app-definition"
import WalletConnectApp from './wallet-connect'
// import { SvgIcon } from '@material-ui/core'
import { requestQueueNotifyN } from './request-queue'
import FindInPage from '@material-ui/icons/FindInPage'

// const WCIcon = (props: {fontSize?: "default" | "large"}): JSX.Element => {
// 	return <SvgIcon
// 		fontSize={props.fontSize}
// 		viewBox="0 0 300 185"
// 		component={WalletConnectIcon}
// 		/>
// }

export const WalletConnect: AppDefinition = {
	id: "wallet-connect",
	core: true,
	title: "WalletConnect",
	icon: <FindInPage />,
	iconLarge: <FindInPage fontSize="large" />,
	// icon: <WCIcon />,
	// iconLarge: <WCIcon fontSize="large" />,
	url: "https://docs.celoterminal.com/guides/using-walletconnect",
	renderApp: WalletConnectApp,
	notifyCount: requestQueueNotifyN,
}
