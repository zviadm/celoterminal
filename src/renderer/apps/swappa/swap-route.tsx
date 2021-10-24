import { Route } from '@terminal-fi/swappa'
import { RegisteredErc20 } from '../../../lib/erc20/core'
import { erc20FromAddress } from '../../../lib/utils'

import * as React from 'react'
import { Box, Typography } from '@material-ui/core'
import LinkedAddress from '../../components/linked-address'

const SwapRoute = (props: {
	route: Route,
	extraErc20s: RegisteredErc20[],
}): JSX.Element => {
	const path = props.route.path
	const pathErc20s = path.map((p) => erc20FromAddress(p, props.extraErc20s))

	return (
		<Box display="flex" flexDirection="row">
			<Typography style={{fontFamily: "monospace"}}>
				{
					pathErc20s.map((p, idx) => {
						return (<>
							<LinkedAddress address={path[idx]} name={p?.symbol} />
							{(idx < pathErc20s.length - 1) ? "->" : ""}
						</>)
					})
				}
			</Typography>
		</Box>
	)
}
export default SwapRoute
