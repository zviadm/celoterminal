import * as React from "react"
import { VpnKey, AccountBalanceWallet, Visibility, Group } from '@material-ui/icons'
import { SvgIconProps } from "@material-ui/core"

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
