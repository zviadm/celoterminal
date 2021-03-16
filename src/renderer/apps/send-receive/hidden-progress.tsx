import * as React from 'react'
import { LinearProgress } from "@material-ui/core"

const HiddenProgress = (props: {hidden?: boolean}): JSX.Element => {
	return (
		<LinearProgress style={{visibility: props.hidden ? "hidden" : undefined}} />
	)
}
export default HiddenProgress