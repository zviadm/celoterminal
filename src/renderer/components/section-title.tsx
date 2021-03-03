import * as React from "react"
import { Typography } from "@material-ui/core"

const SectionTitle = (props: {children: React.ReactNode}): JSX.Element => {
	return (
		<Typography variant="h6" color="textSecondary">{props.children}</Typography>
	)
}
export default SectionTitle