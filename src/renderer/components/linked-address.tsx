import { explorerRootURL } from "../../lib/cfg"
import { fmtAddress } from "../../lib/utils"

import * as React from "react"
import { Typography } from "@material-ui/core"
import Link from "./link"

const LinkedAddress = (props: {address: string, name?: string}): JSX.Element => {
	const url = `${explorerRootURL()}/address/${props.address}`
	return (
		<Link href={url}>
			<Typography style={{fontFamily: "monospace"}}>{props.name || fmtAddress(props.address)}</Typography>
		</Link>
	)
}
export default LinkedAddress