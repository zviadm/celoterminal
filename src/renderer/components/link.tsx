import { shell } from 'electron'

import * as React from 'react'
import MuiLink, { LinkTypeMap } from '@material-ui/core/Link'
// eslint-disable-next-line import/no-unresolved
import { DefaultComponentProps } from '@material-ui/core/OverridableComponent'
import Tooltip from '@material-ui/core/Tooltip'

function Link(props: {
	href: string,
} & DefaultComponentProps<LinkTypeMap>): JSX.Element {
	const handleClick = () => { shell.openExternal(props.href) }
	const propsCopy: DefaultComponentProps<LinkTypeMap> = {...props}
	propsCopy["href"] = "#"

	return (
		<Tooltip title={props.href}>
			<MuiLink {...{
				...propsCopy,
				onClick: handleClick,
				}}
			/>
		</Tooltip>
	)
}
export default Link