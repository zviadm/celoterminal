import * as React from "react"
import { SvgIconProps } from "@material-ui/core"
import VpnKey from '@material-ui/icons/VpnKey'
import AccountBalanceWallet from '@material-ui/icons/AccountBalanceWallet'
import Visibility from '@material-ui/icons/Visibility'
import Group from '@material-ui/icons/Group'

interface AccountIconProps extends SvgIconProps {
	type: "local" | "ledger" | "multisig" | "address-only",
}

const AccountIcon = (props: AccountIconProps): JSX.Element => {
	const propsCopy: SvgIconProps = {...props}
	delete propsCopy.type
	return (
		props.type === "local" ? <VpnKey {...propsCopy} /> :
		props.type === "ledger" ? <AccountBalanceWallet {...propsCopy}  /> :
		props.type === "multisig" ? <Group {...propsCopy}  /> :
		props.type === "address-only" ? <Visibility {...propsCopy} /> : <></>
	)
}
export default AccountIcon
